import type { CAC } from 'cac'

export function registerStatusCommand(cli: CAC) {
  cli
    .command('status', 'Show documentation coverage')
    .action(async () => {
      console.log('status command - TODO')
    })
}
