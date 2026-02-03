import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { StaleChecker } from '../../checker/index.js';
import type { StaleDoc } from '../../checker/types.js';
import { TypeScriptExtractor } from '../../extractor/index.js';
import { Generator } from '../../generator/index.js';

interface CheckOptions {
  fix?: boolean;
}

export function registerCheckCommand(cli: CAC) {
  cli
    .command('check', 'Check if docs are stale')
    .option('--fix', 'Regenerate stale docs')
    .action(async (options: CheckOptions) => {
      p.intro('🔍 Check Documentation');

      try {
        // Load config
        const config = loadConfig();
        if (!config) {
          p.cancel('Config not found. Run: syncdocs init');
          process.exit(1);
        }

        const docsDir = resolve(process.cwd(), config.outputDir);

        if (!existsSync(docsDir)) {
          p.cancel(`Docs directory not found: ${config.outputDir}`);
          process.exit(1);
        }

        // Check for stale docs
        const spinner = p.spinner();
        spinner.start('Scanning documentation files');

        const checker = new StaleChecker();
        const result = checker.checkDocs(docsDir);

        spinner.stop(`Scanned ${result.totalDocs} document${result.totalDocs === 1 ? '' : 's'}`);

        // Display errors if any
        if (result.errors.length > 0) {
          console.log('');
          p.log.error('Errors encountered:');
          for (const error of result.errors) {
            console.log(`  ${error}`);
          }
        }

        // Display results
        console.log('');
        if (result.staleDocs.length === 0) {
          p.log.success(`All ${result.totalDocs} documents are up to date! ✨`);
        } else {
          p.log.warn(
            `Found ${result.staleDocs.length} stale document${result.staleDocs.length === 1 ? '' : 's'}:`,
          );
          console.log('');

          for (const staleDoc of result.staleDocs) {
            console.log(`  📄 ${getRelativePath(staleDoc.docPath)}`);
            for (const dep of staleDoc.staleDependencies) {
              const reason = formatStaleReason(dep.reason);
              console.log(`     ${reason} ${dep.path}:${dep.symbol}`);
              if (dep.reason === 'changed') {
                console.log(`       old: ${dep.oldHash.substring(0, 8)}`);
                console.log(`       new: ${dep.newHash.substring(0, 8)}`);
              }
            }
            console.log('');
          }

          // Offer to fix if --fix flag is set
          if (options.fix) {
            await regenerateStaleDocs(result.staleDocs, config);
          } else {
            console.log('  💡 Run with --fix to regenerate stale docs: syncdocs check --fix');
          }
        }

        p.outro(
          result.staleDocs.length === 0
            ? '✨ Documentation is fresh!'
            : `⚠️  ${result.staleDocs.length} stale doc${result.staleDocs.length === 1 ? '' : 's'} found`,
        );

        // Exit with error code if stale docs found
        if (result.staleDocs.length > 0) {
          process.exit(1);
        }
      } catch (error) {
        p.cancel(
          `Failed to check documentation: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}

async function regenerateStaleDocs(staleDocs: StaleDoc[], config: any) {
  console.log('');
  const spinner = p.spinner();
  spinner.start('Regenerating stale documentation');

  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    spinner.stop('ANTHROPIC_API_KEY not set. Add it to your .env file or export it.');
    return;
  }

  // Create generator
  const generator = new Generator({
    apiKey: process.env.ANTHROPIC_API_KEY,
    outputDir: config.outputDir,
    style: config.style,
    model: config.model,
  });

  const extractor = new TypeScriptExtractor();
  let regenerated = 0;
  let failed = 0;

  for (const staleDoc of staleDocs) {
    for (const dep of staleDoc.staleDependencies) {
      if (dep.reason === 'file-not-found') {
        spinner.message(`Skipping ${dep.symbol} (file not found)`);
        failed++;
        continue;
      }

      spinner.message(`Regenerating ${dep.symbol}`);

      try {
        // Extract the symbol
        const symbol = extractor.extractSymbol(dep.path, dep.symbol);

        if (!symbol) {
          spinner.message(`Failed to extract ${dep.symbol}`);
          failed++;
          continue;
        }

        // Regenerate documentation
        const result = await generator.generate({ symbol });

        if (result.success) {
          regenerated++;
        } else {
          failed++;
        }
      } catch (error) {
        spinner.message(`Failed to regenerate ${dep.symbol}`);
        failed++;
      }
    }
  }

  spinner.stop(
    `Regenerated ${regenerated} document${regenerated === 1 ? '' : 's'}${failed > 0 ? `, ${failed} failed` : ''}`,
  );
}

function formatStaleReason(reason: 'changed' | 'not-found' | 'file-not-found'): string {
  switch (reason) {
    case 'changed':
      return '🔄';
    case 'not-found':
      return '❓';
    case 'file-not-found':
      return '❌';
  }
}

function getRelativePath(absolutePath: string): string {
  const cwd = process.cwd();
  return absolutePath.startsWith(cwd) ? absolutePath.substring(cwd.length + 1) : absolutePath;
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
