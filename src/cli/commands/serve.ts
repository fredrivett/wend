import { exec } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { startServer } from '../../server/index.js';

interface ServeOptions {
  port?: number;
}

export function registerServeCommand(cli: CAC) {
  cli
    .command('serve', 'Start interactive documentation viewer')
    .option('--port <number>', 'Port to run server on (default: 3456)')
    .example('syncdocs serve')
    .example('syncdocs serve --port 8080')
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
        const { url } = await startServer(config.outputDir, port);
        spinner.stop(`Server running at ${url}`);

        // Auto-open in browser
        const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${openCmd} ${url}`);

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

function loadConfig(): { outputDir: string } | null {
  const configPath = resolve(process.cwd(), '_syncdocs/config.yaml');
  if (!existsSync(configPath)) return null;

  const content = readFileSync(configPath, 'utf-8');
  const outputDirMatch = content.match(/outputDir:\s*(.+)/);

  return {
    outputDir: outputDirMatch ? outputDirMatch[1].trim() : '_syncdocs',
  };
}
