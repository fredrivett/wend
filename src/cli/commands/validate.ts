import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CAC } from 'cac';
import { ConfigError } from '../utils/errors.js';

interface Config {
  output?: {
    dir?: string;
    structure?: string;
  };
  scope?: {
    include?: string[];
    exclude?: string[];
  };
  generation?: {
    aiProvider?: string;
    prompt?: string;
  };
  git?: {
    includeCommitMessages?: boolean;
    commitDepth?: number;
  };
}

export function registerValidateCommand(cli: CAC) {
  cli.command('validate', 'Validate syncdocs configuration').action(async () => {
    try {
      const config = await loadAndValidateConfig();

      console.log('✓ Config is valid');
      console.log('✓ Output directory:', config.output?.dir);
      console.log('✓ AI provider:', config.generation?.aiProvider);

      // Check if API key is set
      const provider = config.generation?.aiProvider;
      if (provider === 'anthropic') {
        const hasKey = !!process.env.ANTHROPIC_API_KEY;
        console.log(hasKey ? '✓ ANTHROPIC_API_KEY found' : '⚠ ANTHROPIC_API_KEY not set');
        if (!hasKey) {
          console.log('\n  Set it with: export ANTHROPIC_API_KEY=your-key-here');
        }
      } else if (provider === 'openai') {
        const hasKey = !!process.env.OPENAI_API_KEY;
        console.log(hasKey ? '✓ OPENAI_API_KEY found' : '⚠ OPENAI_API_KEY not set');
        if (!hasKey) {
          console.log('\n  Set it with: export OPENAI_API_KEY=your-key-here');
        }
      }

      process.exit(0);
    } catch (error) {
      if (error instanceof ConfigError) {
        console.error('✗ Config error:', error.message);
        process.exit(2);
      }
      throw error;
    }
  });
}

async function loadAndValidateConfig(): Promise<Config> {
  // Check if config exists
  const configPath = join(process.cwd(), '_syncdocs', 'config.yaml');

  if (!existsSync(configPath)) {
    throw new ConfigError('No config found. Run "syncdocs init" to set up syncdocs.');
  }

  // Read config file
  const configContent = await readFile(configPath, 'utf-8');

  // Parse YAML (simple parser - we'll use a proper YAML lib later)
  const config = parseSimpleYAML(configContent);

  // Validate required fields
  if (!config.output?.dir) {
    throw new ConfigError('Missing required field: output.dir');
  }

  if (!config.scope?.include || config.scope.include.length === 0) {
    throw new ConfigError('Missing required field: scope.include');
  }

  if (!config.generation?.aiProvider) {
    throw new ConfigError('Missing required field: generation.aiProvider');
  }

  const validProviders = ['anthropic', 'openai', 'claude-code'];
  if (!validProviders.includes(config.generation.aiProvider)) {
    throw new ConfigError(
      `Invalid aiProvider: ${config.generation.aiProvider}. Must be one of: ${validProviders.join(', ')}`,
    );
  }

  if (!config.generation?.prompt) {
    throw new ConfigError('Missing required field: generation.prompt');
  }

  return config;
}

// Simple YAML parser for our config format
// TODO: Replace with proper YAML library (js-yaml) later
function parseSimpleYAML(content: string): Config {
  const config: Config = {};
  const lines = content.split('\n');
  let currentSection: string | null = null;
  let currentSubsection: string | null = null;
  let inMultiline = false;
  let multilineKey = '';
  let multilineValue: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      continue;
    }

    // Handle multiline values (|)
    if (line.includes('|')) {
      inMultiline = true;
      multilineKey = line.split(':')[0].trim();
      multilineValue = [];
      continue;
    }

    if (inMultiline) {
      if (line.startsWith('    ') || line.trim() === '') {
        multilineValue.push(line.replace(/^ {4}/, ''));
      } else {
        // End of multiline
        setNestedValue(
          config,
          currentSection,
          currentSubsection,
          multilineKey,
          multilineValue.join('\n').trim(),
        );
        inMultiline = false;
        // Continue processing this line
      }

      if (inMultiline) continue;
    }

    // Top-level sections
    if (!line.startsWith(' ') && line.includes(':')) {
      currentSection = line.split(':')[0].trim();
      currentSubsection = null;
      if (!config[currentSection as keyof Config]) {
        (config as any)[currentSection] = {};
      }
      continue;
    }

    // Subsections (2 spaces)
    if (line.startsWith('  ') && !line.startsWith('    ')) {
      const trimmed = line.trim();
      if (trimmed.includes(':')) {
        const [key, value] = trimmed.split(':').map((s) => s.trim());

        if (value) {
          // Simple key-value
          setNestedValue(config, currentSection, null, key, parseValue(value));
        } else {
          // Subsection
          currentSubsection = key;
          if (currentSection && !(config as any)[currentSection][key]) {
            (config as any)[currentSection][key] = [];
          }
        }
      }
      continue;
    }

    // Array items (4 spaces)
    if (line.startsWith('    -')) {
      const value = line.trim().substring(1).trim();
      if (currentSection && currentSubsection) {
        const section = (config as any)[currentSection];
        if (!Array.isArray(section[currentSubsection])) {
          section[currentSubsection] = [];
        }
        section[currentSubsection].push(value);
      }
    }
  }

  return config;
}

function setNestedValue(
  config: Config,
  section: string | null,
  subsection: string | null,
  key: string,
  value: any,
) {
  if (!section) return;

  if (!subsection) {
    (config as any)[section][key] = value;
  } else {
    if (!(config as any)[section][subsection]) {
      (config as any)[section][subsection] = {};
    }
    (config as any)[section][subsection][key] = value;
  }
}

function parseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  return value;
}
