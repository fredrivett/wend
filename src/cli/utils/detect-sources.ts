import { type Dirent, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_GLOB_SUFFIX = '**/*.{ts,tsx,js,jsx}';
const FALLBACK_PATTERN = `src/${SOURCE_GLOB_SUFFIX}`;

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const CANDIDATE_DIRECTORIES = ['src', 'app/src', 'app', 'lib', 'packages', 'apps'] as const;
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.storybook',
  '.turbo',
  '_syncdocs',
  'build',
  'coverage',
  'dist',
  'e2e',
  'node_modules',
]);

/** Result of source-pattern detection. */
export interface DetectResult {
  /** Include glob patterns. */
  patterns: string[];
  /** Whether patterns were detected from the project layout (`true`) or are just a placeholder guess (`false`). */
  detected: boolean;
}

/**
 * Detect likely source-code include patterns from common project layouts.
 *
 * Checks for workspace configs (pnpm-workspace.yaml, package.json workspaces)
 * first to handle monorepos, then falls back to scanning hardcoded candidate
 * directories. Returns a fallback placeholder when nothing is found.
 */
export function detectIncludePatterns(rootDir: string): DetectResult {
  const workspacePatterns = detectWorkspacePatterns(rootDir);
  if (workspacePatterns) {
    return { patterns: workspacePatterns, detected: true };
  }

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
    return { patterns, detected: true };
  }

  if (hasRootLevelSourceFiles(rootDir)) {
    return { patterns: [SOURCE_GLOB_SUFFIX], detected: true };
  }

  return { patterns: [FALLBACK_PATTERN], detected: false };
}

/**
 * Read workspace package directories from pnpm-workspace.yaml or package.json
 * workspaces, resolve globs, and return include patterns for directories that
 * contain source files. Returns `null` when no workspace config is found.
 */
function detectWorkspacePatterns(rootDir: string): string[] | null {
  const workspaceDirs = readWorkspacePackages(rootDir);
  if (!workspaceDirs) {
    return null;
  }

  const resolved = resolveWorkspaceDirs(rootDir, workspaceDirs);
  const patterns = resolved
    .filter((dir) => containsSourceFiles(join(rootDir, dir), 3))
    .map((dir) => `${dir}/${SOURCE_GLOB_SUFFIX}`);

  return patterns.length > 0 ? patterns : null;
}

/**
 * Read the raw workspace package entries from pnpm-workspace.yaml or
 * package.json. Returns `null` if neither config exists.
 */
function readWorkspacePackages(rootDir: string): string[] | null {
  // Try pnpm-workspace.yaml first
  const pnpmPath = join(rootDir, 'pnpm-workspace.yaml');
  if (existsSync(pnpmPath)) {
    try {
      const content = readFileSync(pnpmPath, 'utf-8');
      return parsePnpmWorkspaceYaml(content);
    } catch {
      // Fall through
    }
  }

  // Try package.json workspaces
  const pkgPath = join(rootDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const workspaces = Array.isArray(pkg.workspaces)
        ? pkg.workspaces
        : Array.isArray(pkg.workspaces?.packages)
          ? pkg.workspaces.packages
          : null;
      if (workspaces && workspaces.length > 0) {
        return workspaces;
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

/**
 * Parse the `packages` list from a pnpm-workspace.yaml string.
 *
 * Handles the simple YAML subset used by pnpm workspace configs — a
 * `packages:` key followed by `- entry` list items.
 */
function parsePnpmWorkspaceYaml(content: string): string[] | null {
  const lines = content.split('\n');
  const entries: string[] = [];
  let inPackages = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'packages:') {
      inPackages = true;
      continue;
    }

    if (inPackages) {
      const match = trimmed.match(/^-\s+(.+)$/);
      if (match) {
        // Strip surrounding quotes if present
        const entry = match[1].replace(/^(['"])(.+)\1$/, '$2');
        entries.push(entry);
      } else if (trimmed && !trimmed.startsWith('#')) {
        // Non-empty, non-comment line that isn't a list item — section ended
        break;
      }
    }
  }

  return entries.length > 0 ? entries : null;
}

/**
 * Resolve workspace entries to concrete directory names.
 *
 * Plain entries (e.g. `backend`) are returned as-is if the directory exists.
 * Glob entries ending with `/*` or `/**` are expanded by listing subdirectories
 * of the parent path. Negated entries (e.g. `!packages/internal`) are excluded
 * from the final result.
 */
function resolveWorkspaceDirs(rootDir: string, entries: string[]): string[] {
  const dirs: string[] = [];
  const negated = new Set<string>();

  // Collect negated entries first
  for (const entry of entries) {
    if (entry.startsWith('!')) {
      negated.add(entry.slice(1));
    }
  }

  for (const entry of entries) {
    if (entry.startsWith('!')) {
      continue;
    }

    // Handle glob patterns like "workshop/*" or "packages/**"
    const globMatch = entry.match(/^(.+?)\/\*\*?$/);
    if (globMatch) {
      const parentDir = globMatch[1];
      const parentPath = join(rootDir, parentDir);
      try {
        const children = readdirSync(parentPath, { withFileTypes: true });
        for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
          if (child.isDirectory() && !IGNORED_DIRECTORIES.has(child.name)) {
            dirs.push(`${parentDir}/${child.name}`);
          }
        }
      } catch {
        // Parent directory doesn't exist, skip
      }
      continue;
    }

    // Plain directory entry
    if (existsSync(join(rootDir, entry))) {
      dirs.push(entry);
    }
  }

  return negated.size > 0 ? dirs.filter((dir) => !negated.has(dir)) : dirs;
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
