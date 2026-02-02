import type { CAC } from 'cac'
import * as p from '@clack/prompts'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

interface InitConfig {
  output: {
    dir: string
  }
  scope: {
    include: string[]
    exclude: string[]
  }
  generation: {
    prompt: string
    aiProvider: 'anthropic' | 'openai' | 'claude-code'
  }
  git: {
    includeCommitMessages: boolean
    commitDepth: number
  }
}

export function registerInitCommand(cli: CAC) {
  cli
    .command('init', 'Initialize syncdocs in your project')
    .action(async () => {
      console.clear()

      p.intro('✨ Welcome to syncdocs')

      // Check if already initialized
      const configPath = join(process.cwd(), '_syncdocs', 'config.yaml')
      if (existsSync(configPath)) {
        const shouldOverwrite = await p.confirm({
          message: 'syncdocs is already initialized. Overwrite?',
          initialValue: false,
        })

        if (p.isCancel(shouldOverwrite) || !shouldOverwrite) {
          p.cancel('Setup cancelled')
          process.exit(0)
        }
      }

      // Gather configuration
      const outputDir = await p.text({
        message: 'Where should docs be generated?',
        placeholder: '_syncdocs',
        initialValue: '_syncdocs',
      })

      if (p.isCancel(outputDir)) {
        p.cancel('Setup cancelled')
        process.exit(0)
      }

      const includePattern = await p.text({
        message: 'Which files should be documented?',
        placeholder: 'src/**/*.{ts,tsx,js,jsx}',
        initialValue: 'src/**/*.{ts,tsx,js,jsx}',
      })

      if (p.isCancel(includePattern)) {
        p.cancel('Setup cancelled')
        process.exit(0)
      }

      const excludePattern = await p.text({
        message: 'Which files should be excluded?',
        placeholder: '**/*.test.ts,**/*.spec.ts,node_modules/**,dist/**,build/**',
        initialValue: '**/*.test.ts,**/*.spec.ts,node_modules/**,dist/**,build/**',
      })

      if (p.isCancel(excludePattern)) {
        p.cancel('Setup cancelled')
        process.exit(0)
      }

      const aiProvider = await p.select({
        message: 'Which AI provider?',
        options: [
          { value: 'anthropic', label: 'Anthropic (Claude)' },
          { value: 'openai', label: 'OpenAI (GPT-4)' },
          { value: 'claude-code', label: 'Use Claude Code access' },
        ],
        initialValue: 'anthropic',
      })

      if (p.isCancel(aiProvider)) {
        p.cancel('Setup cancelled')
        process.exit(0)
      }

      const docStyle = await p.select({
        message: 'How should docs be written?',
        options: [
          {
            value: 'senior',
            label: 'For senior engineers',
            hint: 'Focus on why, edge cases, trade-offs',
          },
          {
            value: 'onboarding',
            label: 'For new team members',
            hint: 'Focus on what, how it works, examples',
          },
          {
            value: 'custom',
            label: 'Custom prompt (advanced)',
            hint: 'Define your own doc generation guidelines',
          },
        ],
        initialValue: 'senior',
      })

      if (p.isCancel(docStyle)) {
        p.cancel('Setup cancelled')
        process.exit(0)
      }

      let customPrompt = ''
      if (docStyle === 'custom') {
        const prompt = await p.text({
          message: 'Enter your documentation prompt:',
          placeholder: 'Document for...',
          validate: (value) => {
            if (!value) return 'Prompt is required'
          },
        })

        if (p.isCancel(prompt)) {
          p.cancel('Setup cancelled')
          process.exit(0)
        }

        customPrompt = prompt
      }

      const includeCommits = await p.confirm({
        message: 'Include git commit messages in generation?',
        initialValue: true,
      })

      if (p.isCancel(includeCommits)) {
        p.cancel('Setup cancelled')
        process.exit(0)
      }

      // Generate config
      const s = p.spinner()
      s.start('Creating configuration...')

      const config: InitConfig = {
        output: {
          dir: outputDir as string,
        },
        scope: {
          include: [includePattern as string],
          exclude: (excludePattern as string)
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean),
        },
        generation: {
          prompt: getPromptForStyle(docStyle as string, customPrompt),
          aiProvider: aiProvider as 'anthropic' | 'openai' | 'claude-code',
        },
        git: {
          includeCommitMessages: includeCommits as boolean,
          commitDepth: 10,
        },
      }

      // Create directory
      const docDir = join(process.cwd(), outputDir as string)
      await mkdir(docDir, { recursive: true })

      // Write config file
      const configYaml = generateConfigYAML(config)
      await writeFile(configPath, configYaml, 'utf-8')

      // Create .gitignore if needed
      const gitignorePath = join(process.cwd(), '.gitignore')
      if (!existsSync(gitignorePath)) {
        await writeFile(gitignorePath, 'node_modules\n', 'utf-8')
      }

      s.stop('Configuration created!')

      p.note(
        `Config saved to: ${outputDir}/config.yaml\n\nNext steps:\n  1. Set your API key: export ANTHROPIC_API_KEY=...\n  2. Generate your first doc: syncdocs generate\n  3. Or run: syncdocs check`,
        'Setup complete!'
      )

      p.outro('Happy documenting! 📝')
    })
}

function getPromptForStyle(style: string, customPrompt: string): string {
  if (style === 'custom') return customPrompt

  const prompts = {
    senior: `Document for senior engineers joining the team.
Focus on why decisions were made, not just what the code does.
Highlight non-obvious behavior, edge cases, and trade-offs.
Keep explanations concise—link to code for implementation details.`,
    onboarding: `Document for new team members learning the codebase.
Focus on what the code does and how it works together.
Explain the happy path clearly with examples.
Call out important patterns and conventions.`,
  }

  return prompts[style as keyof typeof prompts] || prompts.senior
}

function generateConfigYAML(config: InitConfig): string {
  return `# syncdocs configuration
# Learn more: https://github.com/fredrivett/syncdocs

output:
  # Where generated documentation will be stored
  dir: ${config.output.dir}

scope:
  # Files to include in documentation
  include:
${config.scope.include.map((p) => `    - ${p}`).join('\n')}

  # Files to exclude from documentation
  exclude:
${config.scope.exclude.map((p) => `    - ${p}`).join('\n')}

generation:
  # AI provider to use for generation
  aiProvider: ${config.generation.aiProvider}

  # How documentation should be written
  prompt: |
${config.generation.prompt
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')}

git:
  # Include commit messages when regenerating docs
  includeCommitMessages: ${config.git.includeCommitMessages}

  # How many commits back to analyze for context
  commitDepth: ${config.git.commitDepth}
`
}
