import { exec } from 'node:child_process';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { startServer } from '../../server/index.js';
import { loadConfig } from '../utils/config.js';

interface ServeOptions {
  port?: number;
  open?: boolean;
}

export function registerServeCommand(cli: CAC) {
  cli
    .command('serve', 'Start interactive documentation viewer')
    .option('--port <number>', 'Port to run server on (default: 3456)')
    .option('--open', 'Auto-open browser (default: true)')
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

        // Auto-open in browser (unless --no-open)
        if (options.open !== false) {
          const openCmd =
            process.platform === 'darwin'
              ? 'open'
              : process.platform === 'win32'
                ? 'start'
                : 'xdg-open';
          exec(`${openCmd} ${url}`);
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
