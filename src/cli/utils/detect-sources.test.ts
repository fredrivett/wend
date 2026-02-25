import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectIncludePatterns } from './detect-sources.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function createTempProject(): string {
  const projectDir = mkdtempSync(join(tmpdir(), 'syncdocs-detect-'));
  tempDirs.push(projectDir);
  return projectDir;
}

function writeSourceFile(projectDir: string, relativePath: string): void {
  const filePath = join(projectDir, relativePath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, 'export const value = 1;\n', 'utf-8');
}

describe('detectIncludePatterns', () => {
  it('returns src pattern when src contains source files', () => {
    const projectDir = createTempProject();
    writeSourceFile(projectDir, 'src/index.ts');

    expect(detectIncludePatterns(projectDir)).toEqual(['src/**/*.{ts,tsx,js,jsx}']);
  });

  it('returns app/src pattern when src does not exist', () => {
    const projectDir = createTempProject();
    writeSourceFile(projectDir, 'app/src/main.ts');

    expect(detectIncludePatterns(projectDir)).toEqual(['app/src/**/*.{ts,tsx,js,jsx}']);
  });

  it('returns multiple matching patterns in priority order', () => {
    const projectDir = createTempProject();
    writeSourceFile(projectDir, 'src/index.ts');
    writeSourceFile(projectDir, 'lib/utils.ts');

    expect(detectIncludePatterns(projectDir)).toEqual([
      'src/**/*.{ts,tsx,js,jsx}',
      'lib/**/*.{ts,tsx,js,jsx}',
    ]);
  });

  it('returns root-wide pattern when source files only exist at project root', () => {
    const projectDir = createTempProject();
    writeSourceFile(projectDir, 'index.js');

    expect(detectIncludePatterns(projectDir)).toEqual(['**/*.{ts,tsx,js,jsx}']);
  });

  it('falls back to src pattern when no source files are detected', () => {
    const projectDir = createTempProject();
    mkdirSync(join(projectDir, 'docs'), { recursive: true });
    writeFileSync(join(projectDir, 'docs/README.md'), '# docs\n', 'utf-8');

    expect(detectIncludePatterns(projectDir)).toEqual(['src/**/*.{ts,tsx,js,jsx}']);
  });

  it('detects packages monorepo layout', () => {
    const projectDir = createTempProject();
    writeSourceFile(projectDir, 'packages/ui/src/Button.tsx');

    expect(detectIncludePatterns(projectDir)).toEqual(['packages/**/*.{ts,tsx,js,jsx}']);
  });

  it('detects app-router style app directory without src', () => {
    const projectDir = createTempProject();
    writeSourceFile(projectDir, 'app/page.tsx');

    expect(detectIncludePatterns(projectDir)).toEqual(['app/**/*.{ts,tsx,js,jsx}']);
  });

  it('detects apps layout and keeps deterministic order when src also exists', () => {
    const projectDir = createTempProject();
    writeSourceFile(projectDir, 'src/core.ts');
    writeSourceFile(projectDir, 'apps/web/src/main.tsx');

    expect(detectIncludePatterns(projectDir)).toEqual([
      'src/**/*.{ts,tsx,js,jsx}',
      'apps/**/*.{ts,tsx,js,jsx}',
    ]);
  });

  it('ignores build and vendor directories for detection', () => {
    const projectDir = createTempProject();
    writeSourceFile(projectDir, 'dist/index.js');
    writeSourceFile(projectDir, 'node_modules/pkg/index.js');
    writeSourceFile(projectDir, '.next/server/app.js');

    expect(detectIncludePatterns(projectDir)).toEqual(['src/**/*.{ts,tsx,js,jsx}']);
  });

  it('limits scanning depth to three levels below candidate directories', () => {
    const projectDir = createTempProject();
    writeSourceFile(projectDir, 'src/a/b/c/d/too-deep.ts');
    writeSourceFile(projectDir, 'lib/index.ts');

    expect(detectIncludePatterns(projectDir)).toEqual(['lib/**/*.{ts,tsx,js,jsx}']);
  });

  describe('workspace detection', () => {
    it('detects pnpm workspace packages from pnpm-workspace.yaml', () => {
      const projectDir = createTempProject();
      writeFileSync(
        join(projectDir, 'pnpm-workspace.yaml'),
        'packages:\n  - backend\n  - frontend\n',
        'utf-8',
      );
      writeSourceFile(projectDir, 'backend/src/index.ts');
      writeSourceFile(projectDir, 'frontend/src/app.tsx');

      expect(detectIncludePatterns(projectDir)).toEqual([
        'backend/**/*.{ts,tsx,js,jsx}',
        'frontend/**/*.{ts,tsx,js,jsx}',
      ]);
    });

    it('detects npm/yarn workspaces from package.json', () => {
      const projectDir = createTempProject();
      writeFileSync(
        join(projectDir, 'package.json'),
        JSON.stringify({ workspaces: ['api', 'web'] }),
        'utf-8',
      );
      writeSourceFile(projectDir, 'api/src/server.ts');
      writeSourceFile(projectDir, 'web/src/main.tsx');

      expect(detectIncludePatterns(projectDir)).toEqual([
        'api/**/*.{ts,tsx,js,jsx}',
        'web/**/*.{ts,tsx,js,jsx}',
      ]);
    });

    it('detects npm/yarn workspaces from package.json workspaces.packages', () => {
      const projectDir = createTempProject();
      writeFileSync(
        join(projectDir, 'package.json'),
        JSON.stringify({ workspaces: { packages: ['services/api'] } }),
        'utf-8',
      );
      writeSourceFile(projectDir, 'services/api/index.ts');

      expect(detectIncludePatterns(projectDir)).toEqual([
        'services/api/**/*.{ts,tsx,js,jsx}',
      ]);
    });

    it('expands glob patterns in workspace config', () => {
      const projectDir = createTempProject();
      writeFileSync(
        join(projectDir, 'pnpm-workspace.yaml'),
        'packages:\n  - workshop/*\n',
        'utf-8',
      );
      writeSourceFile(projectDir, 'workshop/alpha/src/index.ts');
      writeSourceFile(projectDir, 'workshop/beta/src/index.ts');

      const result = detectIncludePatterns(projectDir);
      expect(result).toContain('workshop/alpha/**/*.{ts,tsx,js,jsx}');
      expect(result).toContain('workshop/beta/**/*.{ts,tsx,js,jsx}');
      expect(result).toHaveLength(2);
    });

    it('excludes workspace dirs that contain no source files', () => {
      const projectDir = createTempProject();
      writeFileSync(
        join(projectDir, 'pnpm-workspace.yaml'),
        'packages:\n  - backend\n  - docs\n',
        'utf-8',
      );
      writeSourceFile(projectDir, 'backend/src/index.ts');
      mkdirSync(join(projectDir, 'docs'), { recursive: true });
      writeFileSync(join(projectDir, 'docs/README.md'), '# docs\n', 'utf-8');

      expect(detectIncludePatterns(projectDir)).toEqual([
        'backend/**/*.{ts,tsx,js,jsx}',
      ]);
    });

    it('falls back to candidate detection when no workspace packages have source files', () => {
      const projectDir = createTempProject();
      writeFileSync(
        join(projectDir, 'pnpm-workspace.yaml'),
        'packages:\n  - docs\n',
        'utf-8',
      );
      mkdirSync(join(projectDir, 'docs'), { recursive: true });
      writeFileSync(join(projectDir, 'docs/README.md'), '# docs\n', 'utf-8');
      writeSourceFile(projectDir, 'src/index.ts');

      expect(detectIncludePatterns(projectDir)).toEqual(['src/**/*.{ts,tsx,js,jsx}']);
    });

    it('prefers pnpm-workspace.yaml over package.json workspaces', () => {
      const projectDir = createTempProject();
      writeFileSync(
        join(projectDir, 'pnpm-workspace.yaml'),
        'packages:\n  - backend\n',
        'utf-8',
      );
      writeFileSync(
        join(projectDir, 'package.json'),
        JSON.stringify({ workspaces: ['different-pkg'] }),
        'utf-8',
      );
      writeSourceFile(projectDir, 'backend/src/index.ts');
      writeSourceFile(projectDir, 'different-pkg/src/index.ts');

      expect(detectIncludePatterns(projectDir)).toEqual([
        'backend/**/*.{ts,tsx,js,jsx}',
      ]);
    });

    it('handles quoted entries in pnpm-workspace.yaml', () => {
      const projectDir = createTempProject();
      writeFileSync(
        join(projectDir, 'pnpm-workspace.yaml'),
        "packages:\n  - 'frontend'\n  - \"backend\"\n",
        'utf-8',
      );
      writeSourceFile(projectDir, 'frontend/app.tsx');
      writeSourceFile(projectDir, 'backend/server.ts');

      expect(detectIncludePatterns(projectDir)).toEqual([
        'frontend/**/*.{ts,tsx,js,jsx}',
        'backend/**/*.{ts,tsx,js,jsx}',
      ]);
    });
  });
});
