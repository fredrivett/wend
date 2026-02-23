import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { loadConfig } from '../utils/config.js';
import {
  computeNextCandidate,
  getRelativePath,
  renderCoverageStats,
  renderJsDocCoverageStats,
  renderMissingJsDocList,
  renderNextSuggestion,
  scanProjectAsync,
} from '../utils/next-suggestion.js';

interface StatusOptions {
  verbose?: boolean;
}

/**
 * Register the `syncdocs status` CLI command.
 *
 * Scans the project for documentation coverage and displays statistics
 * including a coverage bar, undocumented symbols, and a suggestion for
 * the next file to document.
 */
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

        const scan = await scanProjectAsync(config.outputDir, config.scope, (message) => {
          spinner.message(message);
        });

        spinner.stop('Analysis complete');

        renderCoverageStats(scan);
        renderJsDocCoverageStats(scan);

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
          lines.push('💡 Generate docs with one of:');
          lines.push(`   \x1b[1;36msyncdocs sync\x1b[0m`);
          lines.push(`   \x1b[1;36msyncdocs sync <file>\x1b[0m`);
          lines.push(`   \x1b[1;36msyncdocs sync <file>:<symbol>\x1b[0m`);

          p.log.warn('Undocumented symbols:');
          p.log.message(lines.join('\n'));
        } else if (scan.undocumented > 20) {
          p.log.message(
            `💡 \x1b[3mUse --verbose to see all ${scan.undocumented} undocumented symbols\x1b[23m`,
          );
        }

        // Show symbols missing JSDoc
        renderMissingJsDocList(scan, options.verbose ?? false);

        const jsDocCoverage =
          scan.totalSymbols > 0 ? Math.round((scan.withJsDoc / scan.totalSymbols) * 100) : 0;

        if (scan.coverage === 100 && jsDocCoverage === 100) {
          p.outro('\u2728 Perfect coverage!');
        } else if (scan.coverage === 100) {
          p.outro(
            `\u2728 Fully documented! ${jsDocCoverage}% JSDoc coverage \u2014 run \x1b[1;36msyncdocs jsdoc\x1b[0m for next steps`,
          );
        } else {
          p.outro(`${scan.coverage}% documented - keep going! \uD83D\uDCAA`);
        }
      } catch (error) {
        p.cancel(
          `Failed to generate status: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}
