import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { StaticDocGenerator } from '../../generator/static-doc-generator.js';
import { GraphBuilder } from '../../graph/graph-builder.js';
import { entryPoints } from '../../graph/graph-query.js';
import { GraphStore } from '../../graph/graph-store.js';
import { loadConfig } from '../utils/config.js';
import { findSourceFiles } from '../utils/next-suggestion.js';

export function registerSyncCommand(cli: CAC) {
  cli
    .command('sync [target]', 'Build graph and generate documentation')
    .example('syncdocs sync')
    .example('syncdocs sync src/api/')
    .action(async (target?: string) => {
      p.intro('Syncing documentation');

      try {
        const config = loadConfig();
        if (!config) {
          p.cancel('Config not found. Run: syncdocs init');
          process.exit(1);
        }

        const outputDir = resolve(process.cwd(), config.outputDir);
        const spinner = p.spinner();

        // Find source files
        spinner.start('Finding source files');

        let sourceFiles = findSourceFiles(process.cwd(), config.scope);

        // If a target path is provided, filter to files under that path
        if (target) {
          const targetPath = resolve(process.cwd(), target);
          sourceFiles = sourceFiles.filter((f) => f.startsWith(targetPath));

          if (sourceFiles.length === 0) {
            spinner.stop('No source files found');
            p.cancel(`No source files found under: ${target}`);
            process.exit(1);
          }
        }

        spinner.stop(
          `Found ${sourceFiles.length} source file${sourceFiles.length === 1 ? '' : 's'}`,
        );

        // Build graph
        spinner.start(`Analyzing ${sourceFiles.length} files`);

        const builder = new GraphBuilder();
        const graph = builder.build(sourceFiles);

        spinner.stop(`Graph built: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

        // Write graph.json
        spinner.start('Writing graph.json');

        const store = new GraphStore(config.outputDir);
        store.write(graph);

        spinner.stop('Graph saved');

        // Generate static docs
        spinner.start('Generating documentation');

        const docGenerator = new StaticDocGenerator(outputDir);
        let succeeded = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const node of graph.nodes) {
          const result = docGenerator.generateForNode(node, graph);
          if (result.success) {
            succeeded++;
          } else {
            failed++;
            errors.push(`  ${result.symbolName}: ${result.error}`);
          }
        }

        spinner.stop(
          `Generated ${succeeded} doc${succeeded === 1 ? '' : 's'}${failed > 0 ? `, ${failed} failed` : ''}`,
        );

        if (errors.length > 0) {
          p.log.warn(`Errors:\n${errors.join('\n')}`);
        }

        // Report stats
        const entries = entryPoints(graph);
        const edgesByType = new Map<string, number>();
        for (const edge of graph.edges) {
          edgesByType.set(edge.type, (edgesByType.get(edge.type) || 0) + 1);
        }

        const stats = [
          `Nodes: ${graph.nodes.length}`,
          `Edges: ${graph.edges.length}`,
          `Entry points: ${entries.length}`,
          `Docs generated: ${succeeded}`,
        ];

        if (edgesByType.size > 0) {
          stats.push('');
          for (const [type, count] of edgesByType) {
            stats.push(`  ${type}: ${count}`);
          }
        }

        p.log.message(stats.join('\n'));

        p.outro(`Synced to ${config.outputDir}/`);
      } catch (error) {
        p.cancel(`Failed to sync: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}
