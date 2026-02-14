import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { TypeScriptExtractor } from '../../extractor/index.js';
import { Generator } from '../../generator/index.js';
import { showCoverageAndSuggestion } from '../utils/next-suggestion.js';
import { resolveSourcePath } from '../utils/paths.js';

interface RegenerateOptions {
  style?: 'technical' | 'beginner-friendly' | 'comprehensive';
}

interface DocMetadata {
  filePath: string;
  symbolName: string;
  docPath: string;
}

export function registerRegenerateCommand(cli: CAC) {
  cli
    .command('regenerate', 'Regenerate all existing documentation')
    .option('--style <type>', 'Documentation style (technical, beginner-friendly, comprehensive)')
    .example('syncdocs regenerate')
    .action(async (options: RegenerateOptions) => {
      p.intro('🔄 Regenerate All Documentation');

      try {
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

        // Find all existing docs
        const outputDir = resolve(process.cwd(), config.outputDir);
        if (!existsSync(outputDir)) {
          p.cancel(`Output directory not found: ${config.outputDir}`);
          process.exit(1);
        }

        const spinner = p.spinner();
        spinner.start('Scanning for existing documentation files');

        const docs = findAllDocs(outputDir);

        if (docs.length === 0) {
          spinner.stop('No documentation files found');
          process.exit(0);
        }

        spinner.stop(`Found ${docs.length} documentation file${docs.length === 1 ? '' : 's'}`);

        // Show list of docs to be regenerated
        const docLines = docs.map((doc) => `• ${doc.symbolName} (from ${doc.filePath})`);
        p.log.message('Documentation files to regenerate:\n' + docLines.join('\n'));

        // Confirm regeneration
        const shouldContinue = await p.confirm({
          message: `Regenerate ${docs.length} documentation file${docs.length === 1 ? '' : 's'}?`,
          initialValue: true,
        });

        if (p.isCancel(shouldContinue) || !shouldContinue) {
          p.cancel('Regeneration cancelled');
          process.exit(0);
        }

        // Create generator
        const generator = new Generator({
          apiKey: process.env.ANTHROPIC_API_KEY,
          outputDir: config.outputDir,
          style: options.style || config.style,
          model: config.model,
        });

        // Regenerate each doc
        const extractor = new TypeScriptExtractor();
        let completed = 0;
        const results: string[] = [];

        spinner.start(`Regenerating documentation`);

        for (const doc of docs) {
          completed++;
          const resolvedPath = resolveSourcePath(doc.filePath);
          spinner.message(
            `[${completed}/${docs.length}] Regenerating ${doc.symbolName} from ${resolvedPath}`,
          );

          // Check if source file still exists
          if (!existsSync(resolvedPath)) {
            results.push(`  ⚠ ${doc.symbolName}: Source file not found (${resolvedPath})`);
            continue;
          }

          // Extract symbol
          const symbol = extractor.extractSymbol(resolvedPath, doc.symbolName);
          if (!symbol) {
            results.push(`  ⚠ ${doc.symbolName}: Symbol not found in ${doc.filePath}`);
            continue;
          }

          // Generate documentation
          const result = await generator.generate({ symbol });

          if (result.success) {
            results.push(`  ✓ ${doc.symbolName} → ${result.filePath}`);
          } else {
            results.push(`  ✗ ${doc.symbolName}: ${result.error}`);
          }
        }

        spinner.stop(`Regenerated ${completed} document${completed === 1 ? '' : 's'}`);

        // Show results
        p.log.message(results.join('\n'));

        showCoverageAndSuggestion(config.outputDir);

        p.outro('✨ Documentation regeneration complete!');
      } catch (error) {
        p.cancel(
          `Failed to regenerate documentation: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}

function findAllDocs(dir: string): DocMetadata[] {
  const docs: DocMetadata[] = [];

  function scan(currentDir: string) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (entry.endsWith('.md')) {
        const metadata = parseDocMetadata(fullPath);
        if (metadata) {
          docs.push(metadata);
        }
      }
    }
  }

  scan(dir);
  return docs;
}

function parseDocMetadata(docPath: string): DocMetadata | null {
  try {
    const content = readFileSync(docPath, 'utf-8');

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatter = frontmatterMatch[1];

    // Parse dependencies section
    const dependenciesMatch = frontmatter.match(/dependencies:\s*\n([\s\S]*?)(?=\n\w+:|$)/);
    if (!dependenciesMatch) {
      return null;
    }

    // Extract first dependency (the main symbol)
    const pathMatch = dependenciesMatch[1].match(/path:\s*(.+)/);
    const symbolMatch = dependenciesMatch[1].match(/symbol:\s*(.+)/);

    if (!pathMatch || !symbolMatch) {
      return null;
    }

    return {
      filePath: pathMatch[1].trim(),
      symbolName: symbolMatch[1].trim(),
      docPath,
    };
  } catch (error) {
    return null;
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
