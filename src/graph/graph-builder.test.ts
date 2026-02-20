/**
 * Tests for GraphBuilder — specifically barrel file (re-export) edge resolution
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearTsconfigCache } from '../extractor/resolve-import.js';
import { GraphBuilder } from './graph-builder.js';

const TEST_DIR = join(process.cwd(), '.test-graph');

describe('GraphBuilder', () => {
  let builder: GraphBuilder;

  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
    clearTsconfigCache();
    builder = new GraphBuilder();
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    clearTsconfigCache();
  });

  describe('barrel file (re-export) resolution', () => {
    it('should create edges through barrel file re-exports', () => {
      // Set up: component imports from barrel, barrel re-exports from actual file
      const libDir = join(TEST_DIR, 'lib');
      mkdirSync(libDir, { recursive: true });

      // Actual defining file
      const searchFile = join(libDir, 'use-search.ts');
      writeFileSync(searchFile, `export function useSearch() { return { query: '' } }`);

      // Barrel file
      const indexFile = join(libDir, 'index.ts');
      writeFileSync(indexFile, `export { useSearch } from "./use-search"`);

      // Consumer that imports via barrel
      const componentFile = join(TEST_DIR, 'component.ts');
      writeFileSync(
        componentFile,
        `import { useSearch } from "./lib"
export function MyComponent() {
  const search = useSearch()
  return search
}`,
      );

      const graph = builder.build([searchFile, indexFile, componentFile]);

      // Should have nodes for useSearch and MyComponent
      const useSearchNode = graph.nodes.find((n) => n.name === 'useSearch');
      const componentNode = graph.nodes.find((n) => n.name === 'MyComponent');
      expect(useSearchNode).toBeDefined();
      expect(componentNode).toBeDefined();

      // Should have edge: MyComponent → useSearch
      const edge = graph.edges.find(
        (e) => e.source === componentNode?.id && e.target === useSearchNode?.id,
      );
      expect(edge).toBeDefined();
      expect(edge?.type).toBe('direct-call');
    });

    it('should handle renamed re-exports', () => {
      const libDir = join(TEST_DIR, 'lib');
      mkdirSync(libDir, { recursive: true });

      const helperFile = join(libDir, 'helper.ts');
      writeFileSync(helperFile, `export function internalHelper() { return 1 }`);

      const indexFile = join(libDir, 'index.ts');
      writeFileSync(indexFile, `export { internalHelper as helper } from "./helper"`);

      const consumerFile = join(TEST_DIR, 'consumer.ts');
      writeFileSync(
        consumerFile,
        `import { helper } from "./lib"
export function main() {
  return helper()
}`,
      );

      const graph = builder.build([helperFile, indexFile, consumerFile]);

      const helperNode = graph.nodes.find((n) => n.name === 'internalHelper');
      const mainNode = graph.nodes.find((n) => n.name === 'main');
      expect(helperNode).toBeDefined();
      expect(mainNode).toBeDefined();

      const edge = graph.edges.find(
        (e) => e.source === mainNode?.id && e.target === helperNode?.id,
      );
      expect(edge).toBeDefined();
    });

    it('should resolve direct imports without re-export following', () => {
      // Sanity check: direct imports still work
      const utilsFile = join(TEST_DIR, 'utils.ts');
      writeFileSync(utilsFile, `export function doWork() { return 1 }`);

      const mainFile = join(TEST_DIR, 'main.ts');
      writeFileSync(
        mainFile,
        `import { doWork } from "./utils"
export function run() {
  return doWork()
}`,
      );

      const graph = builder.build([utilsFile, mainFile]);

      const doWorkNode = graph.nodes.find((n) => n.name === 'doWork');
      const runNode = graph.nodes.find((n) => n.name === 'run');

      const edge = graph.edges.find((e) => e.source === runNode?.id && e.target === doWorkNode?.id);
      expect(edge).toBeDefined();
    });
  });

  describe('trigger task dispatch edges', () => {
    it('should create async-dispatch edge from tasks.trigger() to task definition', () => {
      const taskFile = join(TEST_DIR, 'my-task.ts');
      writeFileSync(
        taskFile,
        `export const myTask = task({
  id: "my-task",
  run: async () => { return 1 }
})`,
      );

      const callerFile = join(TEST_DIR, 'caller.ts');
      writeFileSync(
        callerFile,
        `export async function handleRequest() {
  await tasks.trigger("my-task", { data: 1 })
}`,
      );

      const graph = builder.build([taskFile, callerFile]);

      const taskNode = graph.nodes.find((n) => n.name === 'myTask');
      const callerNode = graph.nodes.find((n) => n.name === 'handleRequest');
      expect(taskNode).toBeDefined();
      expect(callerNode).toBeDefined();

      const edge = graph.edges.find(
        (e) => e.source === callerNode?.id && e.target === taskNode?.id,
      );
      expect(edge).toBeDefined();
      expect(edge?.type).toBe('async-dispatch');
    });

    it('should handle TypeScript generics in tasks.trigger<typeof T>()', () => {
      const taskFile = join(TEST_DIR, 'analyze.ts');
      writeFileSync(
        taskFile,
        `export const analyzeTask = task({
  id: "analyze",
  run: async () => { return 1 }
})`,
      );

      const callerFile = join(TEST_DIR, 'route.ts');
      writeFileSync(
        callerFile,
        `export async function POST() {
  await tasks.trigger<typeof analyzeTask>("analyze", { id: 1 })
}`,
      );

      const graph = builder.build([taskFile, callerFile]);

      const taskNode = graph.nodes.find((n) => n.name === 'analyzeTask');
      const callerNode = graph.nodes.find((n) => n.name === 'POST');
      expect(taskNode).toBeDefined();
      expect(callerNode).toBeDefined();

      const edge = graph.edges.find(
        (e) => e.source === callerNode?.id && e.target === taskNode?.id,
      );
      expect(edge).toBeDefined();
      expect(edge?.type).toBe('async-dispatch');
    });
  });
});
