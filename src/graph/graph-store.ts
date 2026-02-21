/**
 * Reads and writes FlowGraph to _syncdocs/graph.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { FlowGraph } from './types.js';

export class GraphStore {
  private outputDir: string;

  /** @param outputDir - Root output directory (resolved relative to cwd) */
  constructor(outputDir: string) {
    this.outputDir = resolve(process.cwd(), outputDir);
  }

  /** Absolute path to the `graph.json` file. */
  private get graphPath(): string {
    return join(this.outputDir, 'graph.json');
  }

  /**
   * Write a FlowGraph to disk
   */
  write(graph: FlowGraph): void {
    const dir = dirname(this.graphPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.graphPath, JSON.stringify(graph, null, 2), 'utf-8');
  }

  /**
   * Read a FlowGraph from disk. Returns null if the file doesn't exist.
   */
  read(): FlowGraph | null {
    if (!existsSync(this.graphPath)) {
      return null;
    }
    try {
      const content = readFileSync(this.graphPath, 'utf-8');
      return JSON.parse(content) as FlowGraph;
    } catch {
      return null;
    }
  }

  /**
   * Check if a graph file exists
   */
  exists(): boolean {
    return existsSync(this.graphPath);
  }
}
