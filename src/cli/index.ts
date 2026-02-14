#!/usr/bin/env node

// Load environment variables from .env file
import { config } from 'dotenv';

config({ silent: true });

import { cac } from 'cac';
import { version } from '../../package.json';

const cli = cac('syncdocs');

// Global options
cli.version(version).help();

import { registerCheckCommand } from './commands/check.js';
import { registerGenerateCommand } from './commands/generate.js';
// Register commands
import { registerInitCommand } from './commands/init.js';
import { registerRegenerateCommand } from './commands/regenerate.js';
import { registerServeCommand } from './commands/serve.js';
import { registerStatusCommand } from './commands/status.js';
import { registerValidateCommand } from './commands/validate.js';

registerInitCommand(cli);
registerCheckCommand(cli);
registerGenerateCommand(cli);
registerRegenerateCommand(cli);
registerServeCommand(cli);
registerStatusCommand(cli);
registerValidateCommand(cli);

// Parse CLI arguments
const parsed = cli.parse();

// Show help if no command was matched (e.g. "syncdocs" or "syncdocs help")
// but not when --help or --version was explicitly passed (cac handles those)
if (!cli.matchedCommand && !parsed.options.help && !parsed.options.version) {
  cli.outputHelp();
}
