import { type Dirent, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_GLOB_SUFFIX = '**/*.{ts,tsx,js,jsx}';
const FALLBACK_PATTERN = `src/${SOURCE_GLOB_SUFFIX}`;

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const CANDIDATE_DIRECTORIES = ['src', 'app/src', 'app', 'lib', 'packages', 'apps'] as const;
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.turbo',
  '_syncdocs',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

/**
 * Detect likely source-code include patterns from common project layouts.
 *
 * Returns candidate patterns in priority order. Falls back to the historical
 * default when no likely source files are found.
 */
export function detectIncludePatterns(rootDir: string): string[] {
  const matchedCandidates: string[] = [];
  const patterns: string[] = [];

  for (const candidate of CANDIDATE_DIRECTORIES) {
    if (matchedCandidates.some((matched) => matched.startsWith(`${candidate}/`))) {
      continue;
    }

    const candidatePath = join(rootDir, candidate);
    if (containsSourceFiles(candidatePath, 3)) {
      matchedCandidates.push(candidate);
      patterns.push(`${candidate}/${SOURCE_GLOB_SUFFIX}`);
    }
  }

  if (patterns.length > 0) {
    return patterns;
  }

  if (hasRootLevelSourceFiles(rootDir)) {
    return [SOURCE_GLOB_SUFFIX];
  }

  return [FALLBACK_PATTERN];
}

function containsSourceFiles(directoryPath: string, maxDepth: number): boolean {
  if (!existsSync(directoryPath)) {
    return false;
  }

  return scanDirectory(directoryPath, maxDepth);
}

function scanDirectory(directoryPath: string, remainingDepth: number): boolean {
  let entries: Dirent[];
  try {
    entries = readdirSync(directoryPath, { withFileTypes: true });
  } catch {
    return false;
  }

  for (const entry of entries) {
    if (entry.isFile() && isSourceFile(entry.name)) {
      return true;
    }

    if (
      entry.isDirectory() &&
      remainingDepth > 0 &&
      !IGNORED_DIRECTORIES.has(entry.name) &&
      scanDirectory(join(directoryPath, entry.name), remainingDepth - 1)
    ) {
      return true;
    }
  }

  return false;
}

function hasRootLevelSourceFiles(rootDir: string): boolean {
  let entries: Dirent[];
  try {
    entries = readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return false;
  }

  return entries.some((entry) => entry.isFile() && isSourceFile(entry.name));
}

function isSourceFile(fileName: string): boolean {
  for (const ext of SOURCE_EXTENSIONS) {
    if (fileName.endsWith(ext)) {
      return true;
    }
  }
  return false;
}
