import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
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

        spinner.stop('Analysis complete');

        // Calculate coverage
        const totalSymbols = allSymbols.length;
        const documented = allSymbols.filter((s) =>
          documentedSymbols.has(`${s.file}:${s.symbol.name}`),
        ).length;
        const undocumented = totalSymbols - documented;
        const coverage = totalSymbols > 0 ? Math.round((documented / totalSymbols) * 100) : 0;

        // Display results
        console.log('');
        console.log(`  Source Files: ${sourceFiles.length}`);
        console.log(`  Total Symbols: ${totalSymbols}`);
        console.log(`  Documented: ${documented}`);
        console.log(`  Undocumented: ${undocumented}`);
        console.log('');

        // Coverage bar
        const barWidth = 30;
        const filled = Math.round((coverage / 100) * barWidth);
        const empty = barWidth - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);

        const coverageColor = coverage >= 80 ? '✅' : coverage >= 50 ? '⚠️' : '❌';
        console.log(`  ${coverageColor} Coverage: ${bar} ${coverage}%`);
        console.log('');

        // Show undocumented symbols if verbose or if there are undocumented symbols
        if (undocumented > 0 && (options.verbose || undocumented <= 20)) {
          p.log.warn('Undocumented symbols:');
          console.log('');

          const undocumentedList = allSymbols.filter(
            (s) => !documentedSymbols.has(`${s.file}:${s.symbol.name}`),
          );

          // Group by file
          const byFile = new Map<string, string[]>();
          for (const { file, symbol } of undocumentedList) {
            const relativePath = getRelativePath(file);
            if (!byFile.has(relativePath)) {
              byFile.set(relativePath, []);
            }
            byFile.get(relativePath)!.push(symbol.name);
          }

          for (const [file, symbols] of byFile) {
            console.log(`  📄 ${file}`);
            for (const symbol of symbols) {
              console.log(`     • ${symbol}`);
            }
          }

          console.log('');
          console.log(
            `  💡 Generate docs with: syncdocs generate <file> or syncdocs generate <file>:<symbol>`,
          );
        } else if (undocumented > 20) {
          console.log(`  Use --verbose to see all ${undocumented} undocumented symbols`);
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

function findSourceFiles(rootDir: string, includes: string[], excludes: string[]): string[] {
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
