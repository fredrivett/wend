import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { StaleChecker } from '../../checker/index.js';
import { loadConfig } from '../utils/config.js';

/**
 * Register the `syncdocs check` CLI command.
 *
 * Checks graph.json freshness by comparing stored hashes against current
 * source code. Exits with code 1 if any stale nodes are found (useful for CI).
 */
export function registerCheckCommand(cli: CAC) {
  cli.command('check', 'Check if graph is stale').action(async () => {
    p.intro('Check Documentation');

    try {
      // Load config
      const config = loadConfig();
      if (!config) {
        p.cancel('Config not found. Run: syncdocs init');
        process.exit(1);
      }

      const docsDir = resolve(process.cwd(), config.outputDir);

      if (!existsSync(docsDir)) {
        p.cancel(`Output directory not found: ${config.outputDir}`);
        process.exit(1);
      }

      // Check for stale nodes
      const spinner = p.spinner();
      spinner.start('Checking graph freshness');

      const checker = new StaleChecker();
      const result = checker.checkGraph(config.outputDir);

      spinner.stop(`Checked ${result.totalDocs} node${result.totalDocs === 1 ? '' : 's'}`);

      // Display errors if any
      if (result.errors.length > 0) {
        p.log.error('Errors encountered:');
        p.log.message(result.errors.join('\n'));
      }

      // Display results
      if (result.staleDocs.length === 0) {
        p.log.success(`All ${result.totalDocs} nodes are up to date!`);
      } else {
        p.log.warn(
          `Found ${result.staleDocs.length} stale node${result.staleDocs.length === 1 ? '' : 's'}:`,
        );

        const lines: string[] = [];
        for (const staleDoc of result.staleDocs) {
          lines.push(`  ${staleDoc.nodeId}`);
          for (const dep of staleDoc.staleDependencies) {
            const reason = formatStaleReason(dep.reason);
            lines.push(`   ${reason} ${dep.path}:${dep.symbol}`);
            if (dep.reason === 'changed') {
              lines.push(`     old: ${dep.oldHash.substring(0, 8)}`);
              lines.push(`     new: ${dep.newHash.substring(0, 8)}`);
            }
          }
        }
        p.log.message(lines.join('\n'));

        p.log.message('Run syncdocs sync to update.');
      }

      p.outro(
        result.staleDocs.length === 0
          ? 'Graph is fresh!'
          : `${result.staleDocs.length} stale node${result.staleDocs.length === 1 ? '' : 's'} found`,
      );

      // Exit with error code if stale nodes found
      if (result.staleDocs.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      p.cancel(`Failed to check graph: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });
}

/** Map a staleness reason code to a human-readable label. */
function formatStaleReason(reason: 'changed' | 'not-found' | 'file-not-found'): string {
  switch (reason) {
    case 'changed':
      return 'changed';
    case 'not-found':
      return 'missing';
    case 'file-not-found':
      return 'file deleted';
  }
}
