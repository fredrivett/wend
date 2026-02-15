import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import {
  computeNextCandidate,
  getRelativePath,
  renderCoverageStats,
  renderNextSuggestion,
  scanProjectAsync,
} from '../utils/next-suggestion.js';

interface StatusOptions {
  verbose?: boolean;
}

export function registerStatusCommand(cli: CAC) {
  cli
    .command('status', 'Show documentation coverage')
    .option('--verbose', 'Show detailed symbol information')
    .action(async (options: StatusOptions) => {
      p.intro('📊 Documentation Status');

      try {
        // Load config
        const config = loadConfig();
        if (!config) {
          p.cancel('Config not found. Run: syncdocs init');
          process.exit(1);
        }

        // Scan project and show coverage
        const spinner = p.spinner();
        spinner.start('Finding source files');

        const scan = await scanProjectAsync(config.outputDir, (message) => {
          spinner.message(message);
        });

        spinner.stop('Analysis complete');

        renderCoverageStats(scan);

        // Suggest next file to document
        if (scan.undocumented > 0) {
          const candidate = computeNextCandidate(scan);
          if (candidate) {
            renderNextSuggestion(candidate);
          }
        }

        // Show undocumented symbols if verbose or if there are few enough
        if (scan.undocumented > 0 && (options.verbose || scan.undocumented <= 20)) {
          const undocumentedList = scan.allSymbols.filter(
            (s) => !scan.documentedSymbols.has(`${getRelativePath(s.file)}:${s.symbol.name}`),
          );

          // Group by file
          const byFile = new Map<string, string[]>();
          for (const { file, symbol } of undocumentedList) {
            const relativePath = getRelativePath(file);
            if (!byFile.has(relativePath)) {
              byFile.set(relativePath, []);
            }
            byFile.get(relativePath)?.push(symbol.name);
          }

          const lines: string[] = [];
          for (const [file, symbols] of byFile) {
            lines.push(`📄 ${file}`);
            for (const symbol of symbols) {
              lines.push(`   • ${symbol}`);
            }
          }
          lines.push('');
          lines.push(
            '💡 Generate docs with: syncdocs generate <file> or syncdocs generate <file>:<symbol>',
          );

          p.log.warn('Undocumented symbols:');
          p.log.message(lines.join('\n'));
        } else if (scan.undocumented > 20) {
          p.log.message(
            `💡 \x1b[3mUse --verbose to see all ${scan.undocumented} undocumented symbols\x1b[23m`,
          );
        }

        p.outro(
          scan.coverage === 100
            ? '✨ Perfect coverage!'
            : `${scan.coverage}% documented - keep going! 💪`,
        );
      } catch (error) {
        p.cancel(
          `Failed to generate status: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}

function loadConfig(): {
  outputDir: string;
  includes?: string[];
  excludes?: string[];
} | null {
  const configPath = resolve(process.cwd(), '_syncdocs/config.yaml');

  if (!existsSync(configPath)) {
    return null;
  }

  const content = readFileSync(configPath, 'utf-8');

  // Simple YAML parser for our config
  const outputDirMatch = content.match(/outputDir:\s*(.+)/);

  return {
    outputDir: outputDirMatch ? outputDirMatch[1].trim() : '_syncdocs',
  };
}
