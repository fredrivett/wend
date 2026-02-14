import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { TypeScriptExtractor } from '../../extractor/index.js';
import { Generator } from '../../generator/index.js';
import { showCoverageAndSuggestion } from '../utils/next-suggestion.js';

interface GenerateOptions {
  style?: 'technical' | 'beginner-friendly' | 'comprehensive';
  depth?: number;
  force?: boolean;
}

export function registerGenerateCommand(cli: CAC) {
  cli
    .command('generate <target>', 'Generate documentation for a file or symbol')
    .option('--style <type>', 'Documentation style (technical, beginner-friendly, comprehensive)')
    .option('--depth <n>', 'Recursion depth for call-tree traversal (default: 0)')
    .option('--force', 'Regenerate docs even if they already exist and are up-to-date')
    .example('syncdocs generate src/utils.ts')
    .example('syncdocs generate src/utils.ts:myFunction')
    .example('syncdocs generate src/utils.ts --depth 1')
    .action(async (target: string, options: GenerateOptions) => {
      p.intro('📚 Generate Documentation');

      try {
        // Parse target (file or file:symbol)
        const [filePath, symbolName] = target.split(':');
        const resolvedPath = resolve(process.cwd(), filePath);

        // Validate file exists
        if (!existsSync(resolvedPath)) {
          p.cancel(`File not found: ${filePath}`);
          process.exit(1);
        }

        // Load config
        const config = loadConfig();
        if (!config) {
          p.cancel('Config not found. Run: syncdocs init');
          process.exit(1);
        }

        // Validate API key
        if (!process.env.ANTHROPIC_API_KEY) {
          p.cancel('ANTHROPIC_API_KEY not set. Add it to your .env file or export it.');
          process.exit(1);
        }

        // Create generator
        const generator = new Generator({
          apiKey: process.env.ANTHROPIC_API_KEY,
          outputDir: config.outputDir,
          style: options.style || config.style,
          model: config.model,
        });

        const depth = options.depth ? Number(options.depth) : 0;

        const force = options.force ?? false;

        // Use depth-aware generation when --depth is provided
        if (depth > 0) {
          await generateWithDepth(generator, resolvedPath, filePath, symbolName, depth, force);
        } else if (symbolName) {
          await generateSymbol(generator, resolvedPath, symbolName, filePath, force);
        } else {
          await generateFile(generator, resolvedPath, filePath, force);
        }

        showCoverageAndSuggestion(config.outputDir);

        p.outro('✨ Documentation generated successfully!');
      } catch (error) {
        p.cancel(
          `Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}

async function generateSymbol(
  generator: Generator,
  filePath: string,
  symbolName: string,
  displayPath: string,
  force: boolean,
) {
  const spinner = p.spinner();
  spinner.start(`Extracting ${symbolName} from ${displayPath}`);

  // Extract the specific symbol
  const extractor = new TypeScriptExtractor();
  const symbol = extractor.extractSymbol(filePath, symbolName);

  if (!symbol) {
    spinner.stop(`Symbol "${symbolName}" not found in ${displayPath}`);
    process.exit(1);
  }

  // Check if already up-to-date
  if (!force && generator.isDocUpToDate(symbol)) {
    spinner.stop(`⊘ ${symbolName} is already up-to-date`);
    p.log.message(
      'Use \x1b[1;36m--force\x1b[0m to regenerate, or \x1b[1;36msyncdocs regenerate\x1b[0m for all docs.',
    );
    return;
  }

  spinner.message(`Generating documentation for ${symbolName}`);

  // Generate documentation
  const result = await generator.generate({ symbol });

  if (!result.success) {
    spinner.stop(`Failed: ${result.error}`);
    process.exit(1);
  }

  spinner.stop(`📝 Generated: ${result.filePath}`);
}

async function generateFile(
  generator: Generator,
  filePath: string,
  displayPath: string,
  force: boolean,
) {
  const spinner = p.spinner();
  spinner.start(`Extracting symbols from ${displayPath}`);

  // Extract all symbols
  const extractor = new TypeScriptExtractor();
  const extractResult = extractor.extractSymbols(filePath);

  if (extractResult.symbols.length === 0) {
    spinner.stop(`No symbols found in ${displayPath}`);
    process.exit(1);
  }

  // Dedupe symbols by name (extractor can find same-named nested symbols)
  const seen = new Set<string>();
  const symbols = extractResult.symbols.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });

  const symbolCount = symbols.length;
  spinner.stop(
    `🔍 Found ${symbolCount} symbol${symbolCount === 1 ? '' : 's'}: ${symbols.map((s) => s.name).join(', ')}`,
  );

  // Generate docs for each symbol
  spinner.start(`Generating documentation`);
  let completed = 0;
  let generated = 0;
  let skipped = 0;
  const results: string[] = [];

  for (const symbol of symbols) {
    completed++;

    // Check if already up-to-date
    if (!force && generator.isDocUpToDate(symbol)) {
      skipped++;
      results.push(`  ⊘ ${symbol.name} (up-to-date)`);
      spinner.message(`[${completed}/${symbolCount}] Skipping ${symbol.name} (up-to-date)`);
      continue;
    }

    spinner.message(`[${completed}/${symbolCount}] Generating documentation for ${symbol.name}`);

    const result = await generator.generate({ symbol });

    if (result.success) {
      generated++;
      results.push(`  ✓ ${symbol.name} → ${result.filePath}`);
    } else {
      results.push(`  ✗ ${symbol.name}: ${result.error}`);
    }
  }

  const skippedNote = skipped > 0 ? `, skipped ${skipped} up-to-date` : '';
  spinner.stop(`📝 Generated ${generated} document${generated === 1 ? '' : 's'}${skippedNote}`);

  // Show results
  p.log.message(results.join('\n'));

  if (skipped > 0) {
    p.log.message(
      'Use \x1b[1;36m--force\x1b[0m to regenerate, or \x1b[1;36msyncdocs regenerate\x1b[0m for all docs.',
    );
  }
}

async function generateWithDepth(
  generator: Generator,
  filePath: string,
  displayPath: string,
  symbolName: string | undefined,
  depth: number,
  force: boolean,
) {
  const spinner = p.spinner();
  spinner.start(`Extracting symbols from ${displayPath} (depth: ${depth})`);

  const results = await generator.generateWithDepth(filePath, {
    symbolName,
    depth,
    force,
    onProgress: (msg, type) => {
      if (type === 'info') {
        spinner.stop(msg);
        spinner.start(msg);
      } else {
        spinner.message(msg);
      }
    },
  });

  const generated = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const failed = results.filter((r) => !r.success);

  spinner.stop(
    `📝 Generated ${generated.length} document${generated.length === 1 ? '' : 's'}${skipped.length > 0 ? `, skipped ${skipped.length} up-to-date` : ''}`,
  );

  // Show results
  const lines = results.map((result) => {
    if (result.skipped) {
      return `⊘ ${result.filePath} (up-to-date)`;
    } else if (result.success) {
      return `✓ ${result.filePath}`;
    } else {
      return `✗ ${result.error}`;
    }
  });
  p.log.message(lines.join('\n'));

  if (failed.length > 0) {
    process.exit(1);
  }
}

function loadConfig(): {
  outputDir: string;
  style?: 'technical' | 'beginner-friendly' | 'comprehensive';
  model?: string;
} | null {
  const configPath = resolve(process.cwd(), '_syncdocs/config.yaml');

  if (!existsSync(configPath)) {
    return null;
  }

  const content = readFileSync(configPath, 'utf-8');

  // Simple YAML parser for our config
  const outputDirMatch = content.match(/outputDir:\s*(.+)/);
  const styleMatch = content.match(/style:\s*(.+)/);
  const modelMatch = content.match(/model:\s*(.+)/);

  return {
    outputDir: outputDirMatch ? outputDirMatch[1].trim() : '_syncdocs',
    style: styleMatch ? (styleMatch[1].trim() as any) : undefined,
    model: modelMatch ? modelMatch[1].trim() : undefined,
  };
}
