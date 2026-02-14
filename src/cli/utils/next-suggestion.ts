import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import * as p from '@clack/prompts';
import { DocParser } from '../../checker/doc-parser.js';
import { TypeScriptExtractor } from '../../extractor/index.js';

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
  allSymbols: { file: string; symbol: { name: string } }[];
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
    `\x1b[0m\x1b[1;36msyncdocs generate ${candidate.file}\x1b[0m\x1b[2;90m\n\n${importNote}${candidate.symbolCount} undocumented symbol${candidate.symbolCount === 1 ? '' : 's'}`,
    '👉 Next up',
  );
}

export interface ProjectScan {
  sourceFiles: string[];
  allSymbols: { file: string; symbol: { name: string } }[];
  documentedSymbols: Set<string>;
  totalSymbols: number;
  documented: number;
  undocumented: number;
  coverage: number;
}

/**
 * Scan the project and return coverage data.
 */
export function scanProject(outputDir: string): ProjectScan {
  const docsDir = resolve(process.cwd(), outputDir);

  const sourceFiles = findSourceFiles(process.cwd());
  const allSymbols: { file: string; symbol: { name: string } }[] = [];

  if (sourceFiles.length > 0) {
    const extractor = new TypeScriptExtractor();
    for (const file of sourceFiles) {
      try {
        const result = extractor.extractSymbols(file);
        for (const symbol of result.symbols) {
          allSymbols.push({ file, symbol });
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

  return {
    sourceFiles,
    allSymbols,
    documentedSymbols,
    totalSymbols,
    documented,
    undocumented,
    coverage,
  };
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
 * Self-contained: scan the project, show coverage stats and next suggestion.
 * Use this from commands that don't already have scanning data (e.g. generate).
 */
export function showCoverageAndSuggestion(outputDir: string): void {
  const scan = scanProject(outputDir);
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

export function getRelativePath(absolutePath: string): string {
  const cwd = process.cwd();
  return absolutePath.startsWith(cwd) ? absolutePath.substring(cwd.length + 1) : absolutePath;
}

export function findSourceFiles(rootDir: string): string[] {
  const files: string[] = [];

  const walk = (dir: string) => {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          item === 'node_modules' ||
          item === '.git' ||
          item === 'dist' ||
          item === 'build' ||
          item === '_syncdocs'
        ) {
          continue;
        }
        walk(fullPath);
      } else if (stat.isFile()) {
        if (
          fullPath.endsWith('.ts') ||
          fullPath.endsWith('.tsx') ||
          fullPath.endsWith('.js') ||
          fullPath.endsWith('.jsx')
        ) {
          if (
            fullPath.endsWith('.test.ts') ||
            fullPath.endsWith('.test.tsx') ||
            fullPath.endsWith('.test.js') ||
            fullPath.endsWith('.test.jsx') ||
            fullPath.endsWith('.spec.ts') ||
            fullPath.endsWith('.spec.tsx')
          ) {
            continue;
          }
          files.push(fullPath);
        }
      }
    }
  };

  walk(rootDir);
  return files;
}

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
