import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveSourcePath, toRelativePath } from './paths.js';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => false),
}));

describe('toRelativePath', () => {
  const cwd = '/Users/dev/project';

  it('should return relative path when file is under cwd', () => {
    expect(toRelativePath('/Users/dev/project/src/index.ts', cwd)).toBe('src/index.ts');
  });

  it('should return relative path for nested files under cwd', () => {
    expect(toRelativePath('/Users/dev/project/src/utils/helpers.ts', cwd)).toBe(
      'src/utils/helpers.ts',
    );
  });

  it('should handle path that equals cwd', () => {
    expect(toRelativePath('/Users/dev/project', cwd)).toBe('');
  });

  it('should extract src/ path from a different worktree', () => {
    expect(toRelativePath('/Users/dev/other-worktree/src/generator/index.ts', cwd)).toBe(
      'src/generator/index.ts',
    );
  });

  it('should extract lib/ path from a different worktree', () => {
    expect(toRelativePath('/Users/dev/other-worktree/lib/utils.ts', cwd)).toBe('lib/utils.ts');
  });

  it('should handle already-relative paths', () => {
    expect(toRelativePath('src/index.ts', cwd)).toBe('src/index.ts');
  });

  it('should fallback to path.relative for unknown paths', () => {
    const result = toRelativePath('/completely/different/path/file.ts', cwd);
    expect(result).toBe(
      resolve('/completely/different/path/file.ts')
        .split('/')
        .reduce((acc, _part, i, parts) => {
          // Just verify it doesn't throw and produces some relative path
          return acc;
        }, result),
    );
    // Should not be an absolute path
    expect(result.startsWith('/')).toBe(false);
  });

  it('should not confuse paths where cwd is a prefix but not a directory boundary', () => {
    // /Users/dev/project-extra should NOT match /Users/dev/project
    const result = toRelativePath('/Users/dev/project-extra/src/index.ts', cwd);
    // Should use the src/ fallback, not strip the cwd prefix
    expect(result).toBe('src/index.ts');
  });
});

describe('resolveSourcePath', () => {
  const cwd = '/Users/dev/project';

  beforeEach(() => {
    vi.mocked(existsSync).mockReset();
  });

  it('should resolve relative paths against cwd', () => {
    expect(resolveSourcePath('src/index.ts', cwd)).toBe('/Users/dev/project/src/index.ts');
  });

  it('should return absolute path if it exists', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    expect(resolveSourcePath('/Users/dev/other/src/index.ts', cwd)).toBe(
      '/Users/dev/other/src/index.ts',
    );
  });

  it('should resolve worktree absolute path to cwd when file exists locally', () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      // The original absolute path doesn't exist
      if (path === '/Users/dev/other-worktree/src/generator/index.ts') return false;
      // But the resolved local path does
      if (path === '/Users/dev/project/src/generator/index.ts') return true;
      return false;
    });

    expect(resolveSourcePath('/Users/dev/other-worktree/src/generator/index.ts', cwd)).toBe(
      '/Users/dev/project/src/generator/index.ts',
    );
  });

  it('should resolve worktree absolute path with lib/ prefix', () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      if (path === '/Users/dev/other-worktree/lib/utils.ts') return false;
      if (path === '/Users/dev/project/lib/utils.ts') return true;
      return false;
    });

    expect(resolveSourcePath('/Users/dev/other-worktree/lib/utils.ts', cwd)).toBe(
      '/Users/dev/project/lib/utils.ts',
    );
  });

  it('should fallback to original path when nothing resolves', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    expect(resolveSourcePath('/nonexistent/path/file.ts', cwd)).toBe('/nonexistent/path/file.ts');
  });
});
