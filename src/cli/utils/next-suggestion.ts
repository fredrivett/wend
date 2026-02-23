import { execFile, execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import * as p from '@clack/prompts';
import picomatch from 'picomatch';
import { DocParser } from '../../checker/doc-parser.js';
import { TypeScriptExtractor } from '../../extractor/index.js';
import type { SyncdocsConfig } from './config.js';

export interface NextCandidate {
  file: string;
  symbolCount: number;
  importCount: number;
}

/**
 * Compute the next file to document from pre-computed data.
 * Ranks by import count (most-imported first), then by undocumented symbol count.
 */
export function computeNextCandidate(params: {
  allSymbols: { file: string; symbol: { name: string; hasJsDoc: boolean } }[];
  documentedSymbols: Set<string>;
  sourceFiles: string[];
}): NextCandidate | null {
  const { allSymbols, documentedSymbols, sourceFiles } = params;

  const undocumentedByFile = new Map<string, number>();
  for (const { file, symbol } of allSymbols) {
    const rel = getRelativePath(file);
    if (!documentedSymbols.has(`${rel}:${symbol.name}`)) {
      undocumentedByFile.set(rel, (undocumentedByFile.get(rel) || 0) + 1);
    }
  }

  if (undocumentedByFile.size === 0) return null;

  const importCounts = countImports(sourceFiles);

  const candidates = [...undocumentedByFile.entries()]
    .map(([file, symbolCount]) => ({
      file,
      symbolCount,
      importCount: importCounts.get(file) || 0,
    }))
    .sort((a, b) => b.importCount - a.importCount || b.symbolCount - a.symbolCount);

  return candidates[0] ?? null;
}

/**
 * Render the "Next up" suggestion as a bordered note box.
 */
export function renderNextSuggestion(candidate: NextCandidate): void {
  const importNote =
    candidate.importCount > 0
      ? `imported by ${candidate.importCount} file${candidate.importCount === 1 ? '' : 's'}, `
      : '';
  p.note(
    `\x1b[0m\x1b[1;36msyncdocs sync ${candidate.file}\x1b[0m\x1b[2;90m\n\n${importNote}${candidate.symbolCount} undocumented symbol${candidate.symbolCount === 1 ? '' : 's'}`,
    '👉 Next up',
  );
}

export interface ProjectScan {
  sourceFiles: string[];
  allSymbols: {
    file: string;
    symbol: { name: string; hasJsDoc: boolean; isExported: boolean; isTrivial: boolean };
  }[];
  documentedSymbols: Set<string>;
  totalSymbols: number;
  documented: number;
  undocumented: number;
  coverage: number;
  exportedSymbols: number;
  withJsDoc: number;
}

/**
 * Scan the project and return coverage data.
 */
export function scanProject(outputDir: string, scope: SyncdocsConfig['scope']): ProjectScan {
  const docsDir = resolve(process.cwd(), outputDir);

  const sourceFiles = findSourceFiles(process.cwd(), scope);
  const allSymbols: {
    file: string;
    symbol: { name: string; hasJsDoc: boolean; isExported: boolean; isTrivial: boolean };
  }[] = [];

  if (sourceFiles.length > 0) {
    const extractor = new TypeScriptExtractor();
    for (const file of sourceFiles) {
      try {
        const result = extractor.extractSymbols(file);
        for (const symbol of result.symbols) {
          allSymbols.push({
            file,
            symbol: {
              name: symbol.name,
              hasJsDoc: symbol.jsDoc !== undefined,
              isExported: symbol.isExported ?? false,
              isTrivial: isTrivialBody(symbol.body),
            },
          });
        }
      } catch {
        // Skip files that can't be parsed
      }
    }
  }

  const documentedSymbols = new Set<string>();
  if (existsSync(docsDir)) {
    const docFiles = findMarkdownFiles(docsDir);
    const parser = new DocParser();

    for (const docFile of docFiles) {
      try {
        const metadata = parser.parseDocFile(docFile);
        for (const dep of metadata.dependencies) {
          documentedSymbols.add(`${dep.path}:${dep.symbol}`);
        }
      } catch {
        // Skip invalid doc files
      }
    }
  }

  const totalSymbols = allSymbols.length;
  const documented = allSymbols.filter((s) =>
    documentedSymbols.has(`${getRelativePath(s.file)}:${s.symbol.name}`),
  ).length;
  const undocumented = totalSymbols - documented;
  const coverage = totalSymbols > 0 ? Math.round((documented / totalSymbols) * 100) : 0;
  const nonTrivialExported = (s: (typeof allSymbols)[number]) =>
    s.symbol.isExported && !s.symbol.isTrivial;
  const exportedSymbols = allSymbols.filter(nonTrivialExported).length;
  const withJsDoc = allSymbols.filter((s) => nonTrivialExported(s) && s.symbol.hasJsDoc).length;

  return {
    sourceFiles,
    allSymbols,
    documentedSymbols,
    totalSymbols,
    documented,
    undocumented,
    coverage,
    exportedSymbols,
    withJsDoc,
  };
}

/** Yield to the event loop so spinner animations stay smooth during CPU-bound work. */
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

/**
 * Async version of scanProject that yields throughout
 * so spinner animations stay smooth.
 */
export async function scanProjectAsync(
  outputDir: string,
  scope: SyncdocsConfig['scope'],
  onProgress?: (message: string) => void,
): Promise<ProjectScan> {
  const docsDir = resolve(process.cwd(), outputDir);

  // Phase 1: find source files (async fs, yields naturally at each I/O)
  const sourceFiles = await findSourceFilesAsync(process.cwd(), scope);

  const allSymbols: {
    file: string;
    symbol: { name: string; hasJsDoc: boolean; isExported: boolean; isTrivial: boolean };
  }[] = [];

  if (sourceFiles.length > 0) {
    onProgress?.(`Analyzing ${sourceFiles.length} source files`);
    await tick();

    // Phase 2: extract symbols, yielding every batch of files
    const extractor = new TypeScriptExtractor();
    for (let i = 0; i < sourceFiles.length; i++) {
      try {
        const result = extractor.extractSymbols(sourceFiles[i]);
        for (const symbol of result.symbols) {
          allSymbols.push({
            file: sourceFiles[i],
            symbol: {
              name: symbol.name,
              hasJsDoc: symbol.jsDoc !== undefined,
              isExported: symbol.isExported ?? false,
              isTrivial: isTrivialBody(symbol.body),
            },
          });
        }
      } catch {
        // Skip files that can't be parsed
      }
      if (i % 10 === 9) await tick();
    }
  }

  // Phase 3: check documentation
  onProgress?.('Checking documentation');
  await tick();

  const documentedSymbols = new Set<string>();
  if (existsSync(docsDir)) {
    const docFiles = findMarkdownFiles(docsDir);
    const parser = new DocParser();

    for (const docFile of docFiles) {
      try {
        const metadata = parser.parseDocFile(docFile);
        for (const dep of metadata.dependencies) {
          documentedSymbols.add(`${dep.path}:${dep.symbol}`);
        }
      } catch {
        // Skip invalid doc files
      }
    }
  }

  const totalSymbols = allSymbols.length;
  const documented = allSymbols.filter((s) =>
    documentedSymbols.has(`${getRelativePath(s.file)}:${s.symbol.name}`),
  ).length;
  const undocumented = totalSymbols - documented;
  const coverage = totalSymbols > 0 ? Math.round((documented / totalSymbols) * 100) : 0;
  const nonTrivialExported = (s: (typeof allSymbols)[number]) =>
    s.symbol.isExported && !s.symbol.isTrivial;
  const exportedSymbols = allSymbols.filter(nonTrivialExported).length;
  const withJsDoc = allSymbols.filter((s) => nonTrivialExported(s) && s.symbol.hasJsDoc).length;

  return {
    sourceFiles,
    allSymbols,
    documentedSymbols,
    totalSymbols,
    documented,
    undocumented,
    coverage,
    exportedSymbols,
    withJsDoc,
  };
}

/**
 * Async version of {@link findSourceFiles} that yields to the event loop
 * between I/O operations so spinner animations stay smooth.
 *
 * Prefers `git ls-files` so gitignored files are automatically excluded.
 * Falls back to a manual directory walk when not inside a git repository.
 */
async function findSourceFilesAsync(
  rootDir: string,
  scope: SyncdocsConfig['scope'],
): Promise<string[]> {
  const isIncluded = picomatch(scope.include);
  const isExcluded = picomatch(scope.exclude);

  const gitFiles = await gitTrackedFilesAsync(rootDir);
  if (gitFiles) {
    return gitFiles
      .filter((rel) => isIncluded(rel) && !isExcluded(rel))
      .map((rel) => join(rootDir, rel));
  }

  // Fallback: manual walk when not in a git repo
  const files: string[] = [];

  const walk = async (dir: string) => {
    const items = await readdir(dir);

    for (const item of items) {
      if (item === '.git' || item === 'node_modules') continue;
      const fullPath = join(dir, item);
      const s = await stat(fullPath);

      if (s.isDirectory()) {
        await walk(fullPath);
      } else if (s.isFile()) {
        const rel = relative(rootDir, fullPath);
        if (isIncluded(rel) && !isExcluded(rel)) {
          files.push(fullPath);
        }
      }
    }
  };

  await walk(rootDir);
  return files;
}

/**
 * Render coverage stats (source files, symbols, coverage bar).
 */
export function renderCoverageStats(scan: ProjectScan): void {
  const barWidth = 30;
  const filled = Math.round((scan.coverage / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  const coverageColor =
    scan.coverage >= 75
      ? '\uD83D\uDFE2'
      : scan.coverage >= 50
        ? '\uD83D\uDFE1'
        : scan.coverage >= 25
          ? '\uD83D\uDFE0'
          : '\uD83D\uDD34';

  p.log.message(
    [
      `Source Files: ${scan.sourceFiles.length}`,
      `Total Symbols: ${scan.totalSymbols}`,
      `Documented: ${scan.documented}`,
      `Undocumented: ${scan.undocumented}`,
      '',
      `${coverageColor} Coverage: ${bar} ${scan.coverage}%`,
    ].join('\n'),
  );
}

/**
 * Render JSDoc coverage stats (progress bar + percentage).
 * Styled consistently with {@link renderCoverageStats}.
 */
export function renderJsDocCoverageStats(scan: ProjectScan): void {
  const jsDocCoverage =
    scan.exportedSymbols > 0 ? Math.round((scan.withJsDoc / scan.exportedSymbols) * 100) : 0;
  const withoutJsDoc = scan.exportedSymbols - scan.withJsDoc;
  const barWidth = 30;
  const filled = Math.round((jsDocCoverage / 100) * barWidth);
  const empty = barWidth - filled;
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  const coverageColor =
    jsDocCoverage >= 75
      ? '\uD83D\uDFE2'
      : jsDocCoverage >= 50
        ? '\uD83D\uDFE1'
        : jsDocCoverage >= 25
          ? '\uD83D\uDFE0'
          : '\uD83D\uDD34';

  p.log.message(
    [
      `Exported with JSDoc: ${scan.withJsDoc}`,
      `Exported without JSDoc: ${withoutJsDoc}`,
      '',
      `${coverageColor} JSDoc Coverage (exported): ${bar} ${jsDocCoverage}%`,
    ].join('\n'),
  );
}

/**
 * Render the list of symbols missing JSDoc comments, grouped by file.
 *
 * Shows all symbols when `verbose` is true or when the total count is 20 or fewer.
 * Otherwise, prints a hint to use --verbose.
 *
 * @param scan - Project scan result containing symbol data
 * @param verbose - Whether to force-show all symbols regardless of count
 */
export function renderMissingJsDocList(scan: ProjectScan, verbose: boolean): void {
  const withoutJsDoc = scan.exportedSymbols - scan.withJsDoc;

  if (withoutJsDoc === 0) return;

  if (verbose || withoutJsDoc <= 20) {
    const missingJsDoc = scan.allSymbols.filter(
      (s) => s.symbol.isExported && !s.symbol.isTrivial && !s.symbol.hasJsDoc,
    );

    const byFile = new Map<string, string[]>();
    for (const { file, symbol } of missingJsDoc) {
      const relativePath = getRelativePath(file);
      if (!byFile.has(relativePath)) {
        byFile.set(relativePath, []);
      }
      byFile.get(relativePath)?.push(symbol.name);
    }

    const lines: string[] = [];
    for (const [file, symbols] of byFile) {
      lines.push(`\u{1F4C4} ${file}`);
      for (const sym of symbols) {
        lines.push(`   \u2022 ${sym}`);
      }
    }

    p.log.warn('Symbols missing JSDoc:');
    p.log.message(lines.join('\n'));
  } else {
    p.log.message(
      `\u{1F4A1} \x1b[3mUse --verbose to see all ${withoutJsDoc} symbols missing JSDoc\x1b[23m`,
    );
  }
}

/**
 * Self-contained: scan the project, show coverage stats and next suggestion.
 * Use this from commands that don't already have scanning data (e.g. generate).
 */
export function showCoverageAndSuggestion(outputDir: string, scope: SyncdocsConfig['scope']): void {
  const scan = scanProject(outputDir, scope);
  if (scan.sourceFiles.length === 0) return;

  renderCoverageStats(scan);

  if (scan.undocumented > 0) {
    const candidate = computeNextCandidate(scan);
    if (candidate) {
      renderNextSuggestion(candidate);
    }
  }
}

// --- Shared helpers ---

/**
 * Check whether a function body is trivial (just a return, no logic).
 *
 * A trivial body contains only a single return statement with no preceding
 * declarations, hooks, control flow, or side effects. Examples: icon components
 * that return JSX, or pass-through wrappers that forward props.
 *
 * @param body - The function body text as produced by the TypeScript extractor
 */
export function isTrivialBody(body: string): boolean {
  const inner = body.replace(/^\{/, '').replace(/\}$/, '').trim();
  if (!inner) return false;
  return /^return\s/s.test(inner);
}

/** Convert an absolute path to a path relative to the current working directory. */
export function getRelativePath(absolutePath: string): string {
  const cwd = process.cwd();
  return absolutePath.startsWith(cwd) ? absolutePath.substring(cwd.length + 1) : absolutePath;
}

/**
 * List files known to git (tracked + untracked-but-not-ignored).
 *
 * Returns relative paths. Returns `null` if not inside a git repository.
 */
function gitTrackedFilesSync(rootDir: string): string[] | null {
  try {
    const stdout = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
      cwd: rootDir,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout.split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

/**
 * Async version of {@link gitTrackedFilesSync}.
 */
function gitTrackedFilesAsync(rootDir: string): Promise<string[] | null> {
  return new Promise((resolve) => {
    execFile(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard'],
      { cwd: rootDir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        resolve(stdout.split('\n').filter(Boolean));
      },
    );
  });
}

/**
 * Find all source files matching the scope's include/exclude patterns.
 *
 * Prefers `git ls-files` so gitignored files (e.g. generated code) are
 * automatically excluded. Falls back to a manual directory walk when not
 * inside a git repository.
 *
 * @param rootDir - Root directory to search from
 * @param scope - Include and exclude glob patterns
 */
export function findSourceFiles(rootDir: string, scope: SyncdocsConfig['scope']): string[] {
  const isIncluded = picomatch(scope.include);
  const isExcluded = picomatch(scope.exclude);

  const gitFiles = gitTrackedFilesSync(rootDir);
  if (gitFiles) {
    return gitFiles
      .filter((rel) => isIncluded(rel) && !isExcluded(rel))
      .map((rel) => join(rootDir, rel));
  }

  // Fallback: manual walk when not in a git repo
  const files: string[] = [];

  const walk = (dir: string) => {
    const items = readdirSync(dir);

    for (const item of items) {
      if (item === '.git' || item === 'node_modules') continue;
      const fullPath = join(dir, item);
      const s = statSync(fullPath);

      if (s.isDirectory()) {
        walk(fullPath);
      } else if (s.isFile()) {
        const rel = relative(rootDir, fullPath);
        if (isIncluded(rel) && !isExcluded(rel)) {
          files.push(fullPath);
        }
      }
    }
  };

  walk(rootDir);
  return files;
}

/**
 * Recursively find all `.md` files in a directory.
 *
 * Skips `node_modules` and `.git` directories. Returns an empty array
 * if the directory doesn't exist or can't be read.
 */
export function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (item === 'node_modules' || item === '.git') {
          continue;
        }
        files.push(...findMarkdownFiles(fullPath));
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return files;
}

/**
 * Count how many times each source file is imported by other files.
 *
 * Parses import/export statements from all source files, resolves relative
 * specifiers, and tallies import counts per file. Used to rank documentation
 * priority (most-imported files first).
 *
 * @param sourceFiles - List of absolute source file paths
 * @returns Map of relative file path to import count
 */
export function countImports(sourceFiles: string[]): Map<string, number> {
  const importCounts = new Map<string, number>();
  const importPattern = /(?:import|export)\s+.*?from\s+['"]([^'"]+)['"]/g;

  for (const file of sourceFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      for (const match of content.matchAll(importPattern)) {
        const specifier = match[1];

        if (!specifier.startsWith('.')) continue;

        const dir = dirname(file);
        const resolved = resolveImport(dir, specifier, sourceFiles);
        if (resolved) {
          const rel = getRelativePath(resolved);
          importCounts.set(rel, (importCounts.get(rel) || 0) + 1);
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return importCounts;
}

/**
 * Resolve a relative import specifier to an absolute file path.
 *
 * Tries the exact path, then common extensions (`.ts`, `.tsx`, `.js`, `.jsx`),
 * then `index.*` variants. Only resolves to files in the `sourceFiles` list.
 */
function resolveImport(fromDir: string, specifier: string, sourceFiles: string[]): string | null {
  const base = resolve(fromDir, specifier);

  if (sourceFiles.includes(base)) return base;

  const stripped = base.replace(/\.[jt]sx?$/, '');

  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    if (sourceFiles.includes(stripped + ext)) return stripped + ext;
  }

  for (const ext of extensions) {
    const indexPath = join(base, `index${ext}`);
    if (sourceFiles.includes(indexPath)) return indexPath;
  }
  for (const ext of extensions) {
    const indexPath = join(stripped, `index${ext}`);
    if (sourceFiles.includes(indexPath)) return indexPath;
  }

  return null;
}
