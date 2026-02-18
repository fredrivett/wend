import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface SyncdocsConfig {
  outputDir: string;
  scope: {
    include: string[];
    exclude: string[];
  };
}

export function loadConfig(cwd = process.cwd()): SyncdocsConfig | null {
  const configPath = resolve(cwd, '_syncdocs/config.yaml');
  if (!existsSync(configPath)) return null;

  const content = readFileSync(configPath, 'utf-8');

  const dirMatch = content.match(/^\s*dir:\s*(.+)/m);
  const outputDir = dirMatch ? dirMatch[1].trim() : '_syncdocs';

  const include = parseYamlList(content, 'include');
  const exclude = parseYamlList(content, 'exclude');

  return {
    outputDir,
    scope: { include, exclude },
  };
}

/**
 * Parse a YAML list under a given key.
 * Finds `key:` on its own line, then collects subsequent `- value` lines.
 */
function parseYamlList(content: string, key: string): string[] {
  const keyPattern = new RegExp(`^\\s*${key}:\\s*$`, 'm');
  const keyMatch = keyPattern.exec(content);
  if (!keyMatch) return [];

  const afterKey = content.slice(keyMatch.index + keyMatch[0].length);
  const items: string[] = [];

  for (const line of afterKey.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    const listItemMatch = trimmed.match(/^-\s+(.+)/);
    if (listItemMatch) {
      items.push(listItemMatch[1].trim());
    } else {
      break;
    }
  }

  return items;
}
