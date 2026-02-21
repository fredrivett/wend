import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { detectIncludePatterns } from '../utils/detect-sources.js';

interface InitConfig {
  output: {
    dir: string;
  };
  scope: {
    include: string[];
    exclude: string[];
  };
}

/**
 * Register the `syncdocs init` CLI command.
 *
 * Runs an interactive setup wizard that prompts for output directory,
 * include/exclude patterns, and writes a `config.yaml` file.
 */
export function registerInitCommand(cli: CAC) {
  cli.command('init', 'Initialize syncdocs in your project').action(async () => {
    // biome-ignore lint/suspicious/noConsole: intentional clear before init wizard
    console.clear();

    p.intro('Welcome to syncdocs');

    // Check if already initialized
    const configPath = join(process.cwd(), '_syncdocs', 'config.yaml');
    if (existsSync(configPath)) {
      const shouldOverwrite = await p.confirm({
        message: 'syncdocs is already initialized. Overwrite?',
        initialValue: false,
      });

      if (p.isCancel(shouldOverwrite) || !shouldOverwrite) {
        p.cancel('Setup cancelled');
        process.exit(0);
      }
    }

    // Gather configuration
    const outputDir = await p.text({
      message: 'Where should docs be generated?',
      placeholder: '_syncdocs',
      initialValue: '_syncdocs',
    });

    if (p.isCancel(outputDir)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    const detectedIncludePatterns = detectIncludePatterns(process.cwd());
    const includeInitialValue = detectedIncludePatterns.join(',');

    const includePattern = await p.text({
      message: 'Which files should be documented?',
      placeholder: includeInitialValue,
      initialValue: includeInitialValue,
    });

    if (p.isCancel(includePattern)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    const excludePattern = await p.text({
      message: 'Which files should be excluded?',
      placeholder: '**/*.test.ts,**/*.spec.ts,node_modules/**,dist/**,build/**',
      initialValue: '**/*.test.ts,**/*.spec.ts,node_modules/**,dist/**,build/**',
    });

    if (p.isCancel(excludePattern)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    // Generate config
    const s = p.spinner();
    s.start('Creating configuration...');

    const config: InitConfig = {
      output: {
        dir: outputDir as string,
      },
      scope: {
        include: splitGlobPatterns(includePattern as string),
        exclude: (excludePattern as string)
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
      },
    };

    // Create directory
    const docDir = join(process.cwd(), outputDir as string);
    await mkdir(docDir, { recursive: true });

    // Write config file
    const configYaml = generateConfigYAML(config);
    await writeFile(configPath, configYaml, 'utf-8');

    // Create .gitignore if needed
    const gitignorePath = join(process.cwd(), '.gitignore');
    if (!existsSync(gitignorePath)) {
      await writeFile(gitignorePath, 'node_modules\n', 'utf-8');
    }

    s.stop('Configuration created!');

    p.note(
      `Config saved to: ${outputDir}/config.yaml\n\nNext steps:\n  1. Run: syncdocs sync\n  2. View: syncdocs serve`,
      'Setup complete!',
    );

    p.outro('Happy documenting!');
  });
}

/**
 * Split a comma-separated glob list while preserving commas inside brace sets.
 * Example: `<pattern-1>,<pattern-2>` => two patterns.
 */
function splitGlobPatterns(input: string): string[] {
  const patterns: string[] = [];
  let current = '';
  let braceDepth = 0;

  for (const char of input) {
    if (char === '{') {
      braceDepth += 1;
    } else if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
    }

    if (char === ',' && braceDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) {
        patterns.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed) {
    patterns.push(trimmed);
  }

  return patterns;
}

/** Serialize an init config object to a YAML config file string. */
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
`;
}
