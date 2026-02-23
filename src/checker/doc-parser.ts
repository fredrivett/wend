/**
 * Parse documentation files with frontmatter
 */

import { readFileSync } from 'node:fs';
import type { DocDependency, DocMetadata } from './types.js';

/** Parses documentation markdown files and extracts frontmatter metadata (title, hashes, dependencies). */
export class DocParser {
  /**
   * Parse a doc file and extract metadata from frontmatter
   */
  parseDocFile(filePath: string): DocMetadata {
    const content = readFileSync(filePath, 'utf-8');
    return this.parseFrontmatter(content);
  }

  /**
   * Parse YAML frontmatter from markdown
   * Format:
   * ---
   * title: My Doc
   * generated: 2026-02-03T00:00:00Z
   * dependencies:
   *   - path: src/foo.ts
   *     symbol: myFunction
   *     hash: abc123
   *     asOf: commit123
   * ---
   */
  private parseFrontmatter(content: string): DocMetadata {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      throw new Error('No frontmatter found in doc file');
    }

    const frontmatter = frontmatterMatch[1];
    const lines = frontmatter.split('\n');

    let title = '';
    let syncdocsVersion: string | undefined;
    let generated = '';
    let kind: string | undefined;
    let exported: boolean | undefined;
    let isAsync: boolean | undefined;
    let hasJsDoc: boolean | undefined;
    let isTrivial: boolean | undefined;
    let deprecated: string | boolean | undefined;
    let filePath: string | undefined;
    let lineRange: string | undefined;
    let entryType: string | undefined;
    let httpMethod: string | undefined;
    let route: string | undefined;
    let eventTrigger: string | undefined;
    let taskId: string | undefined;
    const dependencies: DocDependency[] = [];
    let inDependencies = false;
    let currentDep: Partial<DocDependency> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('title:')) {
        title = trimmed.substring(6).trim();
      } else if (trimmed.startsWith('syncdocsVersion:')) {
        syncdocsVersion = trimmed.substring(16).trim();
      } else if (trimmed.startsWith('generated:')) {
        generated = trimmed.substring(10).trim();
      } else if (trimmed.startsWith('kind:')) {
        kind = trimmed.substring(5).trim();
      } else if (trimmed.startsWith('exported:')) {
        exported = trimmed.substring(9).trim() === 'true';
      } else if (trimmed.startsWith('async:')) {
        isAsync = trimmed.substring(6).trim() === 'true';
      } else if (trimmed.startsWith('hasJsDoc:')) {
        hasJsDoc = trimmed.substring(9).trim() === 'true';
      } else if (trimmed.startsWith('isTrivial:')) {
        isTrivial = trimmed.substring(10).trim() === 'true';
      } else if (trimmed.startsWith('deprecated:')) {
        const val = trimmed.substring(11).trim();
        deprecated = val === 'true' ? true : val;
      } else if (trimmed.startsWith('filePath:')) {
        filePath = trimmed.substring(9).trim();
      } else if (trimmed.startsWith('lineRange:')) {
        lineRange = trimmed.substring(10).trim();
      } else if (trimmed.startsWith('entryType:')) {
        entryType = trimmed.substring(10).trim();
      } else if (trimmed.startsWith('httpMethod:')) {
        httpMethod = trimmed.substring(11).trim();
      } else if (trimmed.startsWith('route:')) {
        route = trimmed.substring(6).trim();
      } else if (trimmed.startsWith('eventTrigger:')) {
        eventTrigger = trimmed.substring(13).trim();
      } else if (trimmed.startsWith('taskId:')) {
        taskId = trimmed.substring(7).trim();
      } else if (trimmed.startsWith('dependencies:')) {
        inDependencies = true;
      } else if (inDependencies) {
        if (trimmed.startsWith('- path:')) {
          // Save previous dep if exists
          if (currentDep?.path && currentDep?.symbol && currentDep?.hash) {
            dependencies.push(currentDep as DocDependency);
          }
          // Start new dependency
          currentDep = {
            path: trimmed.substring(7).trim(),
          };
        } else if (trimmed.startsWith('symbol:') && currentDep) {
          currentDep.symbol = trimmed.substring(7).trim();
        } else if (trimmed.startsWith('hash:') && currentDep) {
          currentDep.hash = trimmed.substring(5).trim();
        } else if (trimmed.startsWith('asOf:') && currentDep) {
          currentDep.asOf = trimmed.substring(5).trim();
        } else if (trimmed && !trimmed.startsWith('-') && !trimmed.includes(':')) {
          // End of dependencies
          inDependencies = false;
        }
      }
    }

    // Save last dependency
    if (currentDep?.path && currentDep?.symbol && currentDep?.hash) {
      dependencies.push(currentDep as DocDependency);
    }

    return {
      title,
      syncdocsVersion,
      generated,
      dependencies,
      kind,
      exported,
      isAsync,
      hasJsDoc,
      isTrivial,
      deprecated,
      filePath,
      lineRange,
      entryType,
      httpMethod,
      route,
      eventTrigger,
      taskId,
    };
  }
}
