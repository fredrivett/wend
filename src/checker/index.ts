/**
 * Staleness checker - detects when docs are out of sync with code
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveSourcePath } from '../cli/utils/paths.js';
import { TypeScriptExtractor } from '../extractor/index.js';
import { ContentHasher } from '../hasher/index.js';
import { DocParser } from './doc-parser.js';
import type { CheckResult, StaleDependency, StaleDoc } from './types.js';

export class StaleChecker {
  private extractor: TypeScriptExtractor;
  private hasher: ContentHasher;
  private parser: DocParser;

  constructor() {
    this.extractor = new TypeScriptExtractor();
    this.hasher = new ContentHasher();
    this.parser = new DocParser();
  }

  /**
   * Check all docs in a directory for staleness
   */
  checkDocs(docsDir: string): CheckResult {
    const result: CheckResult = {
      totalDocs: 0,
      staleDocs: [],
      upToDate: [],
      errors: [],
    };

    if (!existsSync(docsDir)) {
      result.errors.push(`Docs directory not found: ${docsDir}`);
      return result;
    }

    // Find all markdown files recursively
    const docFiles = this.findMarkdownFiles(docsDir);
    result.totalDocs = docFiles.length;

    for (const docPath of docFiles) {
      try {
        const staleInfo = this.checkDoc(docPath);
        if (staleInfo) {
          result.staleDocs.push(staleInfo);
        } else {
          result.upToDate.push(docPath);
        }
      } catch (error) {
        result.errors.push(
          `Error checking ${docPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return result;
  }

  /**
   * Check a single doc file for staleness
   * Returns StaleDoc if stale, null if up to date
   */
  checkDoc(docPath: string): StaleDoc | null {
    const metadata = this.parser.parseDocFile(docPath);
    const staleDeps: StaleDependency[] = [];

    for (const dep of metadata.dependencies) {
      // Resolve paths (handles relative paths and foreign worktree paths)
      const depPath = resolveSourcePath(dep.path);

      // Check if source file exists
      if (!existsSync(depPath)) {
        staleDeps.push({
          path: dep.path,
          symbol: dep.symbol,
          oldHash: dep.hash,
          newHash: '',
          reason: 'file-not-found',
        });
        continue;
      }

      // Extract current symbol
      const currentSymbol = this.extractor.extractSymbol(depPath, dep.symbol);

      if (!currentSymbol) {
        staleDeps.push({
          path: dep.path,
          symbol: dep.symbol,
          oldHash: dep.hash,
          newHash: '',
          reason: 'not-found',
        });
        continue;
      }

      // Hash current symbol
      const currentHash = this.hasher.hashSymbol(currentSymbol);

      // Compare hashes
      if (currentHash !== dep.hash) {
        staleDeps.push({
          path: dep.path,
          symbol: dep.symbol,
          oldHash: dep.hash,
          newHash: currentHash,
          reason: 'changed',
        });
      }
    }

    if (staleDeps.length > 0) {
      return {
        docPath,
        reason: this.formatStaleReason(staleDeps),
        staleDependencies: staleDeps,
      };
    }

    return null;
  }

  /**
   * Find all markdown files in a directory recursively
   */
  private findMarkdownFiles(dir: string): string[] {
    const files: string[] = [];

    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip certain directories
        if (item === 'node_modules' || item === '.git') {
          continue;
        }
        files.push(...this.findMarkdownFiles(fullPath));
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Format a human-readable reason for staleness
   */
  private formatStaleReason(staleDeps: StaleDependency[]): string {
    const reasons = staleDeps.map((dep) => {
      switch (dep.reason) {
        case 'changed':
          return `${dep.path}:${dep.symbol} changed`;
        case 'not-found':
          return `${dep.path}:${dep.symbol} not found`;
        case 'file-not-found':
          return `${dep.path} not found`;
      }
    });

    return reasons.join(', ');
  }
}

export { DocParser } from './doc-parser.js';
export * from './types.js';
