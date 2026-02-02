import type { CAC } from 'cac'

export function registerValidateCommand(cli: CAC) {
  cli
    .command('validate', 'Validate syncdocs configuration')
    .action(async () => {
      console.log('validate command - TODO')
    })
}
