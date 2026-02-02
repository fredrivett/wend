import type { CAC } from 'cac'

export function registerCheckCommand(cli: CAC) {
  cli
    .command('check', 'Check if docs are stale')
    .option('--fix', 'Regenerate stale docs')
    .action(async (options) => {
      console.log('check command - TODO', options)
    })
}
