import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from './config.js';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(),
}));

describe('loadConfig', () => {
  it('should parse unquoted glob values', () => {
    vi.mocked(readFileSync).mockReturnValue(
      `dir: _syncdocs
scope:
  include:
    - src/**/*.ts
    - src/**/*.tsx
  exclude:
    - **/*.test.*
    - **/*.spec.*`,
    );

    const config = loadConfig('/project');

    expect(config).toEqual({
      outputDir: '_syncdocs',
      scope: {
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: ['**/*.test.*', '**/*.spec.*'],
      },
    });
  });

  it('should strip double quotes from values', () => {
    vi.mocked(readFileSync).mockReturnValue(
      `dir: _syncdocs
scope:
  include:
    - "src/**/*.ts"
  exclude:
    - "**/*.test.*"`,
    );

    const config = loadConfig('/project');

    expect(config?.scope.include).toEqual(['src/**/*.ts']);
    expect(config?.scope.exclude).toEqual(['**/*.test.*']);
  });

  it('should strip single quotes from values', () => {
    vi.mocked(readFileSync).mockReturnValue(
      `dir: _syncdocs
scope:
  include:
    - 'src/**/*.ts'
  exclude:
    - '**/*.test.*'`,
    );

    const config = loadConfig('/project');

    expect(config?.scope.include).toEqual(['src/**/*.ts']);
    expect(config?.scope.exclude).toEqual(['**/*.test.*']);
  });

  it('should strip quotes from dir value', () => {
    vi.mocked(readFileSync).mockReturnValue(
      `dir: "docs"
scope:
  include:
    - src/**/*.ts`,
    );

    const config = loadConfig('/project');

    expect(config?.outputDir).toBe('docs');
  });

  it('should return null when config file does not exist', () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);

    expect(loadConfig('/project')).toBeNull();
  });
});
