import type { CAC } from 'cac'

export function registerInitCommand(cli: CAC) {
  cli
    .command('init', 'Initialize syncdocs in your project')
    .action(async () => {
      console.log('init command - TODO')
    })
}
