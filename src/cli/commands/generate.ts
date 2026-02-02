import type { CAC } from 'cac'

export function registerGenerateCommand(cli: CAC) {
  cli
    .command('generate', 'Generate documentation for a symbol')
    .option('--file <path>', 'Source file path')
    .option('--symbol <name>', 'Symbol name to document')
    .action(async (options) => {
      console.log('generate command - TODO', options)
    })
}
