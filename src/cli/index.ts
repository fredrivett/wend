#!/usr/bin/env node

import { cac } from 'cac'
import { version } from '../../package.json'

const cli = cac('syncdocs')

// Global options
cli
  .version(version)
  .help()

// Register commands
import { registerInitCommand } from './commands/init.js'
import { registerCheckCommand } from './commands/check.js'
import { registerGenerateCommand } from './commands/generate.js'
import { registerStatusCommand } from './commands/status.js'
import { registerValidateCommand } from './commands/validate.js'

registerInitCommand(cli)
registerCheckCommand(cli)
registerGenerateCommand(cli)
registerStatusCommand(cli)
registerValidateCommand(cli)

// Parse CLI arguments
cli.parse()
