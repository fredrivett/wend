import { exec } from 'node:child_process';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import picomatch from 'picomatch';
import type { FlowGraph } from '../../graph/types.js';
import { startServer } from '../../server/index.js';
import { loadConfig, type SyncdocsConfig } from '../utils/config.js';

interface ServeOptions {
  port?: number;
  open?: boolean;
  focus?: string;
}

/**
 * Resolve focus targets to graph node IDs.
 *
 * Matches each target as an exact node ID first, then as a file path
 * (all symbols in that file). Unresolved targets are returned separately.
 *
 * @param targets - Comma-separated focus targets (file:symbol or file)
 * @param graph - The loaded flow graph
 * @returns Resolved node IDs and any unresolved target strings
 */
function resolveFocusTargets(
  targets: string,
  graph: FlowGraph,
): { nodeIds: string[]; unresolved: string[] } {
  const nodeIdSet = new Set(graph.nodes.map((n) => n.id));
  const nodeIds: string[] = [];
  const unresolved: string[] = [];

  const allTargets = targets
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  for (const target of allTargets) {
    if (nodeIdSet.has(target)) {
      nodeIds.push(target);
    } else {
      const fileMatches = graph.nodes.filter((n) => n.filePath === target);
      if (fileMatches.length > 0) {
        nodeIds.push(...fileMatches.map((n) => n.id));
      } else {
        unresolved.push(target);
      }
    }
  }

  return { nodeIds, unresolved };
}

/**
 * Explain why a file path couldn't be resolved against the graph.
 *
 * Checks whether the file is outside the configured scope (not matched
 * by include patterns, or matched by exclude patterns).
 *
 * @param filePath - The file path portion of the unresolved target
 * @param config - The loaded syncdocs config with scope patterns
 * @returns Human-readable reason, or null if the cause is unclear
 */
function explainUnresolved(filePath: string, config: SyncdocsConfig): string | null {
  const isIncluded = config.scope.include.some((pattern) => picomatch(pattern)(filePath));
  if (!isIncluded) {
    return `not matched by scope.include: ${config.scope.include.join(', ')}`;
  }

  const isExcluded = config.scope.exclude.some((pattern) => picomatch(pattern)(filePath));
  if (isExcluded) {
    return 'matched by scope.exclude';
  }

  return null;
}

/**
 * Register the `syncdocs serve` CLI command.
 *
 * Starts the documentation viewer HTTP server and optionally opens it
 * in the default browser. Supports `--focus` to open with specific
 * symbols or files pre-selected and focused.
 */
export function registerServeCommand(cli: CAC) {
  cli
    .command('serve', 'Start interactive documentation viewer')
    .option('--port <number>', 'Port to run server on (default: 3456)')
    .option('--open', 'Auto-open browser (default: true)')
    .option('--focus <targets>', 'Focus on file:symbol or file (comma-separated)')
    .example('syncdocs serve')
    .example('syncdocs serve --port 8080')
    .example('syncdocs serve --focus src/api/route.ts:GET,src/lib/db.ts:query')
    .action(async (options: ServeOptions) => {
      p.intro('syncdocs viewer');

      const config = loadConfig();
      if (!config) {
        p.cancel('Config not found. Run: syncdocs init');
        process.exit(1);
      }

      const port = options.port ? Number(options.port) : 3456;

      const spinner = p.spinner();
      spinner.start('Building symbol index...');

      try {
        const { url, graph } = await startServer(config.outputDir, port);
        spinner.stop(`Server running at ${url}`);

        // Resolve --focus targets to node IDs and build URL
        let openUrl = url;
        if (options.focus && options.focus.length > 0) {
          if (!graph) {
            p.cancel('No graph data available. Run: syncdocs sync');
            process.exit(1);
          }

          const { nodeIds, unresolved } = resolveFocusTargets(options.focus, graph);

          if (unresolved.length > 0) {
            for (const target of unresolved) {
              const filePath = target.includes(':') ? target.split(':')[0] : target;
              const reason = explainUnresolved(filePath, config);
              p.log.warn(`Could not resolve: ${target}${reason ? ` (${reason})` : ''}`);
            }
            p.cancel('All focus targets must resolve');
            process.exit(1);
          }

          const encoded = nodeIds.map(encodeURIComponent).join(',');
          openUrl = `${url}?selected=${encoded}&focused=${encoded}`;
          p.log.info(`Focused on ${nodeIds.length} node${nodeIds.length > 1 ? 's' : ''}`);
        }

        // Auto-open in browser (unless --no-open)
        if (options.open !== false) {
          const openCmd =
            process.platform === 'darwin'
              ? 'open'
              : process.platform === 'win32'
                ? 'start'
                : 'xdg-open';
          exec(`${openCmd} "${openUrl}"`);
        }

        p.log.message('Press Ctrl+C to stop');

        // Keep process alive
        await new Promise(() => {});
      } catch (error) {
        spinner.stop('Failed to start server');
        p.cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}
