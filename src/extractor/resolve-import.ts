/**
 * Import path resolution with tsconfig path alias support
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

interface TsconfigPaths {
  baseDir: string;
  patterns: Array<{ prefix: string; replacement: string }>;
}

// Cache tsconfig paths per directory to avoid repeated filesystem walks
const tsconfigCache = new Map<string, TsconfigPaths | null>();

/**
 * Find and parse tsconfig.json paths from a source file's directory.
 * Walks up the directory tree until it finds a tsconfig.json.
 * Results are cached per tsconfig.json location.
 */
export function loadTsconfigPaths(fromFile: string): TsconfigPaths | null {
  let dir = dirname(resolve(fromFile));

  // Walk up looking for tsconfig.json (dir !== parent detects filesystem root on all platforms)
  while (dir !== dirname(dir)) {
    if (tsconfigCache.has(dir)) {
      return tsconfigCache.get(dir) ?? null;
    }

    const tsconfigPath = join(dir, 'tsconfig.json');
    if (existsSync(tsconfigPath)) {
      try {
        const content = readFileSync(tsconfigPath, 'utf-8');
        // Strip comments (// and /* */) before parsing — tsconfig allows them
        const stripped = content
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '');
        const config = JSON.parse(stripped);
        const paths = config?.compilerOptions?.paths;

        if (!paths || typeof paths !== 'object') {
          tsconfigCache.set(dir, null);
          return null;
        }

        // Convert path patterns to prefix/replacement pairs
        // e.g. { "@/*": ["./src/*"] } → { prefix: "@/", replacement: "./src/" }
        const patterns: TsconfigPaths['patterns'] = [];

        for (const [pattern, targets] of Object.entries(paths)) {
          if (!Array.isArray(targets) || targets.length === 0) continue;
          const target = targets[0] as string;

          if (pattern.endsWith('/*') && target.endsWith('/*')) {
            patterns.push({
              prefix: pattern.slice(0, -1), // "@/*" → "@/"
              replacement: target.slice(0, -1), // "./src/*" → "./src/"
            });
          }
        }

        const result: TsconfigPaths = { baseDir: dir, patterns };
        tsconfigCache.set(dir, result);
        return result;
      } catch {
        tsconfigCache.set(dir, null);
        return null;
      }
    }

    dir = dirname(dir);
  }

  return null;
}

const EXTENSIONS = ['.ts', '.tsx', '/index.ts', '/index.tsx', '.js', '.jsx'];

// TypeScript ESM projects import with .js extensions but source files are .ts
// e.g. import { foo } from "./bar.js" → actual file is ./bar.ts
const EXT_SWAPS: Array<[string, string[]]> = [
  ['.js', ['.ts', '.tsx']],
  ['.jsx', ['.tsx', '.ts']],
  ['.mjs', ['.mts', '.ts']],
];

/**
 * Try to resolve a file path by testing common extensions.
 * Handles .js → .ts extension swapping for TypeScript ESM projects.
 */
function tryResolveFile(basePath: string): string | null {
  // If the path already exists as-is, use it
  if (existsSync(basePath)) {
    return basePath;
  }

  // Try swapping .js/.jsx/.mjs extensions to .ts/.tsx/.mts
  for (const [fromExt, toExts] of EXT_SWAPS) {
    if (basePath.endsWith(fromExt)) {
      const withoutExt = basePath.slice(0, -fromExt.length);
      for (const toExt of toExts) {
        const candidate = withoutExt + toExt;
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }
  }

  // Try appending extensions (for extensionless imports)
  for (const ext of EXTENSIONS) {
    const candidate = basePath + ext;
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Resolve an import specifier to an absolute file path.
 *
 * Handles:
 * - Relative imports (./foo, ../bar)
 * - tsconfig path aliases (@/lib/foo, @app/trigger/bar)
 * - Skips bare package imports (react, @trigger.dev/sdk)
 *
 * Returns null if the import can't be resolved or should be skipped.
 */
export function resolveImportPath(fromFile: string, importSource: string): string | null {
  // 1. Relative imports
  if (importSource.startsWith('.')) {
    const dir = dirname(resolve(fromFile));
    const basePath = resolve(dir, importSource);
    return tryResolveFile(basePath);
  }

  // 2. Try tsconfig path aliases
  const tsconfig = loadTsconfigPaths(fromFile);
  if (tsconfig) {
    for (const { prefix, replacement } of tsconfig.patterns) {
      if (importSource.startsWith(prefix)) {
        const rest = importSource.slice(prefix.length);
        const mappedPath = resolve(tsconfig.baseDir, replacement + rest);
        return tryResolveFile(mappedPath);
      }
    }
  }

  // 3. Bare package import — skip
  return null;
}

/**
 * Clear the tsconfig cache (useful for testing)
 */
export function clearTsconfigCache(): void {
  tsconfigCache.clear();
}
