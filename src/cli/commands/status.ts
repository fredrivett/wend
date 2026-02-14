import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import * as p from '@clack/prompts';
import type { CAC } from 'cac';
import { DocParser } from '../../checker/doc-parser.js';
import { TypeScriptExtractor } from '../../extractor/index.js';
import type { SymbolInfo } from '../../extractor/types.js';

interface StatusOptions {
  verbose?: boolean;
}

export function registerStatusCommand(cli: CAC) {
  cli
    .command('status', 'Show documentation coverage')
    .option('--verbose', 'Show detailed symbol information')
    .action(async (options: StatusOptions) => {
      p.intro('📊 Documentation Status');

      try {
        // Load config
        const config = loadConfig();
        if (!config) {
          p.cancel('Config not found. Run: syncdocs init');
          process.exit(1);
        }

        const docsDir = resolve(process.cwd(), config.outputDir);

        // Find all source files
        const spinner = p.spinner();
        spinner.start('Scanning project files');

        const sourceFiles = findSourceFiles(
          process.cwd(),
          config.includes || ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
          config.excludes || [],
        );

        spinner.message(`Analyzing ${sourceFiles.length} source files`);

        // Extract all symbols
        const extractor = new TypeScriptExtractor();
        const allSymbols: { file: string; symbol: SymbolInfo }[] = [];

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

        spinner.message('Checking documentation coverage');

        // Find documented symbols
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

        spinner.stop('✅ Analysis complete');

        // Calculate coverage (doc paths are relative, source paths are absolute)
        const totalSymbols = allSymbols.length;
        const documented = allSymbols.filter((s) =>
          documentedSymbols.has(`${getRelativePath(s.file)}:${s.symbol.name}`),
        ).length;
        const undocumented = totalSymbols - documented;
        const coverage = totalSymbols > 0 ? Math.round((documented / totalSymbols) * 100) : 0;

        // Display results
        const barWidth = 30;
        const filled = Math.round((coverage / 100) * barWidth);
        const empty = barWidth - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const coverageColor =
          coverage >= 75 ? '🟢' : coverage >= 50 ? '🟡' : coverage >= 25 ? '🟠' : '🔴';

        p.log.message(
          [
            `Source Files: ${sourceFiles.length}`,
            `Total Symbols: ${totalSymbols}`,
            `Documented: ${documented}`,
            `Undocumented: ${undocumented}`,
            '',
            `${coverageColor} Coverage: ${bar} ${coverage}%`,
          ].join('\n'),
        );

        // Suggest next file to document (most imported undocumented file)
        if (undocumented > 0) {
          const importCounts = countImports(sourceFiles);
          const undocumentedByFile = new Map<string, number>();
          for (const { file, symbol } of allSymbols) {
            const rel = getRelativePath(file);
            if (!documentedSymbols.has(`${rel}:${symbol.name}`)) {
              undocumentedByFile.set(rel, (undocumentedByFile.get(rel) || 0) + 1);
            }
          }

          // Score each file: primary sort by import count (desc), tiebreak by undocumented symbols (desc)
          const candidates = [...undocumentedByFile.entries()]
            .map(([file, symbolCount]) => ({
              file,
              symbolCount,
              importCount: importCounts.get(file) || 0,
            }))
            .sort((a, b) => b.importCount - a.importCount || b.symbolCount - a.symbolCount);

          if (candidates.length > 0) {
            const next = candidates[0];
            const importNote = next.importCount > 0
              ? `imported by ${next.importCount} file${next.importCount === 1 ? '' : 's'}, `
              : '';
            p.note(
              `\x1b[0m\x1b[1;36msyncdocs generate ${next.file}\x1b[0m\x1b[2;90m\n\n${importNote}${next.symbolCount} undocumented symbol${next.symbolCount === 1 ? '' : 's'}`,
              '👉 Next up',
            );
          }
        }

        // Show undocumented symbols if verbose or if there are undocumented symbols
        if (undocumented > 0 && (options.verbose || undocumented <= 20)) {
          const undocumentedList = allSymbols.filter(
            (s) => !documentedSymbols.has(`${getRelativePath(s.file)}:${s.symbol.name}`),
          );

          // Group by file
          const byFile = new Map<string, string[]>();
          for (const { file, symbol } of undocumentedList) {
            const relativePath = getRelativePath(file);
            if (!byFile.has(relativePath)) {
              byFile.set(relativePath, []);
            }
            byFile.get(relativePath)?.push(symbol.name);
          }

          const lines: string[] = [];
          for (const [file, symbols] of byFile) {
            lines.push(`📄 ${file}`);
            for (const symbol of symbols) {
              lines.push(`   • ${symbol}`);
            }
          }
          lines.push('');
          lines.push('💡 Generate docs with: syncdocs generate <file> or syncdocs generate <file>:<symbol>');

          p.log.warn('Undocumented symbols:');
          p.log.message(lines.join('\n'));
        } else if (undocumented > 20) {
          p.log.message(`Use --verbose to see all ${undocumented} undocumented symbols`);
        }

        p.outro(
          coverage === 100 ? '✨ Perfect coverage!' : `${coverage}% documented - keep going! 💪`,
        );
      } catch (error) {
        p.cancel(
          `Failed to generate status: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}

function findSourceFiles(rootDir: string, _includes: string[], _excludes: string[]): string[] {
  const files: string[] = [];

  // Simple recursive file finder
  // In a real implementation, we'd use a glob library like fast-glob
  const walk = (dir: string) => {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      // Skip excluded directories
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
        // Check if file matches includes
        if (
          fullPath.endsWith('.ts') ||
          fullPath.endsWith('.tsx') ||
          fullPath.endsWith('.js') ||
          fullPath.endsWith('.jsx')
        ) {
          // Skip test files
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

function findMarkdownFiles(dir: string): string[] {
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

function getRelativePath(absolutePath: string): string {
  const cwd = process.cwd();
  return absolutePath.startsWith(cwd) ? absolutePath.substring(cwd.length + 1) : absolutePath;
}

/**
 * Count how many files import each source file (fan-in).
 * Returns a map of relative file path → number of importers.
 */
function countImports(sourceFiles: string[]): Map<string, number> {
  const importCounts = new Map<string, number>();
  const importPattern = /(?:import|export)\s+.*?from\s+['"]([^'"]+)['"]/g;

  for (const file of sourceFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      let match: RegExpExecArray | null;

      while ((match = importPattern.exec(content)) !== null) {
        const specifier = match[1];

        // Only count relative imports (skip node_modules / bare specifiers)
        if (!specifier.startsWith('.')) continue;

        // Resolve to absolute path, try common extensions
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
 * Resolve a relative import specifier to an absolute source file path.
 */
function resolveImport(fromDir: string, specifier: string, sourceFiles: string[]): string | null {
  const base = resolve(fromDir, specifier);

  // Try exact match first (already has extension)
  if (sourceFiles.includes(base)) return base;

  // Strip .js/.jsx extension (TS projects import .js but source is .ts)
  const stripped = base.replace(/\.[jt]sx?$/, '');

  // Try common extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    if (sourceFiles.includes(stripped + ext)) return stripped + ext;
  }

  // Try index files (import from directory)
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

function loadConfig(): {
  outputDir: string;
  includes?: string[];
  excludes?: string[];
} | null {
  const configPath = resolve(process.cwd(), '_syncdocs/config.yaml');

  if (!existsSync(configPath)) {
    return null;
  }

  const content = readFileSync(configPath, 'utf-8');

  // Simple YAML parser for our config
  const outputDirMatch = content.match(/outputDir:\s*(.+)/);

  return {
    outputDir: outputDirMatch ? outputDirMatch[1].trim() : '_syncdocs',
  };
}
