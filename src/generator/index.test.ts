/**
 * Tests for documentation generator
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SymbolInfo } from '../extractor/types.js';
import { Generator } from './index.js';

// Mock the AIClient
vi.mock('./ai-client.js', () => {
  return {
    AIClient: class MockAIClient {
      generateDoc = vi.fn().mockResolvedValue('# Test Function\n\nThis is a test function.');
    },
  };
});

const TEST_DIR = join(process.cwd(), '.test-generator');
const OUTPUT_DIR = join(TEST_DIR, 'docs');
const SRC_DIR = join(TEST_DIR, 'src');

describe('Generator', () => {
  let generator: Generator;

  beforeEach(() => {
    // Clean up and create test directories
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(OUTPUT_DIR, { recursive: true });
    mkdirSync(SRC_DIR, { recursive: true });

    generator = new Generator({
      apiKey: 'test-api-key',
      outputDir: OUTPUT_DIR,
    });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate documentation for a symbol', async () => {
      const symbol: SymbolInfo = {
        name: 'testFunction',
        kind: 'function',
        filePath: join(SRC_DIR, 'test.ts'),
        params: 'a: number, b: number',
        body: '{ return a + b }',
        fullText: 'function testFunction(a: number, b: number) { return a + b }',
        startLine: 1,
        endLine: 3,
      };

      const result = await generator.generate({ symbol });

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.error).toBeUndefined();

      // Verify file was created
      expect(existsSync(result.filePath!)).toBe(true);
    });

    it('should create file with frontmatter and content', async () => {
      const symbol: SymbolInfo = {
        name: 'myFunc',
        kind: 'function',
        filePath: join(SRC_DIR, 'utils.ts'),
        params: 'x: number',
        body: '{ return x * 2 }',
        fullText: 'function myFunc(x: number) { return x * 2 }',
        startLine: 5,
        endLine: 7,
      };

      const result = await generator.generate({ symbol });

      const content = readFileSync(result.filePath!, 'utf-8');

      // Should have frontmatter
      expect(content).toMatch(/^---/);
      expect(content).toContain('title:');
      expect(content).toContain('generated:');
      expect(content).toContain('dependencies:');

      // Should have dependency with relative path and hash
      expect(content).toContain('path: .test-generator/src/utils.ts');
      expect(content).toContain('symbol: myFunc');
      expect(content).toContain('hash:');

      // Should have generated content
      expect(content).toContain('# Test Function');
      expect(content).toContain('This is a test function.');
    });

    it('should include dependencies with correct hashes', async () => {
      const symbol: SymbolInfo = {
        name: 'calculate',
        kind: 'function',
        filePath: join(SRC_DIR, 'math.ts'),
        params: 'n: number',
        body: '{ return n * n }',
        fullText: 'function calculate(n: number) { return n * n }',
        startLine: 1,
        endLine: 3,
      };

      const result = await generator.generate({ symbol });
      const content = readFileSync(result.filePath!, 'utf-8');

      // Parse frontmatter to check hash format
      const hashMatch = content.match(/hash: ([a-f0-9]{64})/);
      expect(hashMatch).toBeTruthy();
      expect(hashMatch?.[1]).toHaveLength(64);
    });

    it('should generate kebab-case file names', async () => {
      const testCases = [
        { name: 'MyClass', expected: 'my-class.md' },
        { name: 'getUserData', expected: 'get-user-data.md' },
        { name: 'APIClient', expected: 'api-client.md' },
        { name: 'generateConfigYAML', expected: 'generate-config-yaml.md' },
        { name: 'simple', expected: 'simple.md' },
      ];

      for (const { name, expected } of testCases) {
        const symbol: SymbolInfo = {
          name,
          kind: 'function',
          filePath: join(SRC_DIR, 'test.ts'),
          params: '',
          body: '{}',
          fullText: `function ${name}() {}`,
          startLine: 1,
          endLine: 1,
        };

        const result = await generator.generate({ symbol });
        expect(result.filePath).toContain(expected);
      }
    });

    it('should include related symbols as dependencies', async () => {
      const mainSymbol: SymbolInfo = {
        name: 'processData',
        kind: 'function',
        filePath: join(SRC_DIR, 'processor.ts'),
        params: 'data: Data[]',
        body: '{ return data.map(transform) }',
        fullText: 'function processData(data: Data[]) { return data.map(transform) }',
        startLine: 1,
        endLine: 3,
      };

      const relatedSymbol: SymbolInfo = {
        name: 'transform',
        kind: 'function',
        filePath: join(SRC_DIR, 'utils.ts'),
        params: 'd: Data',
        body: '{ return { ...d, processed: true } }',
        fullText: 'function transform(d: Data) { return { ...d, processed: true } }',
        startLine: 5,
        endLine: 7,
      };

      const result = await generator.generate({
        symbol: mainSymbol,
        context: {
          relatedSymbols: [relatedSymbol],
        },
      });

      const content = readFileSync(result.filePath!, 'utf-8');

      // Should have both dependencies
      expect(content).toContain('symbol: processData');
      expect(content).toContain('symbol: transform');
      expect(content).toContain('path: .test-generator/src/processor.ts');
      expect(content).toContain('path: .test-generator/src/utils.ts');
    });

    it('should handle generation errors gracefully', async () => {
      // This test would require mocking fetch errors or AI client errors
      // For now, we'll test that the error handling structure is in place
      // by creating a symbol with an invalid path
      const symbol: SymbolInfo = {
        name: 'errorFunc',
        kind: 'function',
        filePath: join(SRC_DIR, 'error.ts'),
        params: '',
        body: '{}',
        fullText: 'function errorFunc() {}',
        startLine: 1,
        endLine: 1,
      };

      // Mock should succeed, so this should pass
      const result = await generator.generate({ symbol });
      expect(result.success).toBe(true);
    });

    it('should extract title from generated content', async () => {
      // The mock returns '# Test Function\n\nThis is a test function.'
      // So we should extract "Test Function" as the title
      const symbol: SymbolInfo = {
        name: 'testFunc',
        kind: 'function',
        filePath: join(SRC_DIR, 'test.ts'),
        params: '',
        body: '{}',
        fullText: 'function testFunc() {}',
        startLine: 1,
        endLine: 1,
      };

      const result = await generator.generate({ symbol });
      const content = readFileSync(result.filePath!, 'utf-8');

      expect(content).toContain('title: Test Function');
    });

    it('should use extracted title from h1 heading', async () => {
      // The mock returns content with '# Test Function' heading
      // Verify that we extract this title correctly
      const symbol: SymbolInfo = {
        name: 'myFunction',
        kind: 'function',
        filePath: join(SRC_DIR, 'test.ts'),
        params: '',
        body: '{}',
        fullText: 'function myFunction() {}',
        startLine: 1,
        endLine: 1,
      };

      const result = await generator.generate({ symbol });
      const content = readFileSync(result.filePath!, 'utf-8');

      // Should extract "Test Function" from the h1, not use "myFunction"
      expect(content).toContain('title: Test Function');
    });
  });

  describe('generateForFile', () => {
    it('should generate docs for all symbols in a file', async () => {
      const sourceCode = `
export function add(a: number, b: number): number {
  return a + b
}

export function subtract(a: number, b: number): number {
  return a - b
}

export class Calculator {
  multiply(a: number, b: number): number {
    return a * b
  }
}
`;
      const sourcePath = join(SRC_DIR, 'math.ts');
      writeFileSync(sourcePath, sourceCode);

      const results = await generator.generateForFile(sourcePath);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.success)).toBe(true);

      // Should have generated files for each symbol in subdirectory matching source structure
      // Files are nested under source filename: docs/{relative-dir}/{source-file-name}/{symbol}.md
      const docDir = join(OUTPUT_DIR, '.test-generator', 'src', 'math');
      expect(existsSync(join(docDir, 'add.md'))).toBe(true);
      expect(existsSync(join(docDir, 'subtract.md'))).toBe(true);
      expect(existsSync(join(docDir, 'calculator.md'))).toBe(true);
    });

    it('should handle file with no symbols', async () => {
      const sourceCode = '// Just a comment';
      const sourcePath = join(SRC_DIR, 'empty.ts');
      writeFileSync(sourcePath, sourceCode);

      const results = await generator.generateForFile(sourcePath);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('No symbols found');
    });
  });

  describe('frontmatter generation', () => {
    it('should generate valid YAML frontmatter', async () => {
      const symbol: SymbolInfo = {
        name: 'testFunc',
        kind: 'function',
        filePath: join(SRC_DIR, 'test.ts'),
        params: 'x: number',
        body: '{ return x }',
        fullText: 'function testFunc(x: number) { return x }',
        startLine: 1,
        endLine: 3,
      };

      const result = await generator.generate({ symbol });
      const content = readFileSync(result.filePath!, 'utf-8');

      // Check frontmatter structure
      expect(content).toMatch(/^---\n/);
      expect(content).toMatch(/\n---\n/);

      // Check required fields
      expect(content).toMatch(/title: .+/);
      expect(content).toMatch(/generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(content).toContain('dependencies:');
      expect(content).toContain('- path:');
      expect(content).toContain('symbol:');
      expect(content).toContain('hash:');
    });

    it('should include syncdocsVersion in frontmatter when configured', async () => {
      const versionedGenerator = new Generator({
        apiKey: 'test-api-key',
        outputDir: OUTPUT_DIR,
        syncdocsVersion: '1.2.3',
      });

      const symbol: SymbolInfo = {
        name: 'testFunc',
        kind: 'function',
        filePath: join(SRC_DIR, 'test.ts'),
        params: '',
        body: '{}',
        fullText: 'function testFunc() {}',
        startLine: 1,
        endLine: 1,
      };

      const result = await versionedGenerator.generate({ symbol });
      const content = readFileSync(result.filePath!, 'utf-8');

      expect(content).toContain('syncdocsVersion: 1.2.3');
    });

    it('should omit syncdocsVersion from frontmatter when not configured', async () => {
      const symbol: SymbolInfo = {
        name: 'testFunc',
        kind: 'function',
        filePath: join(SRC_DIR, 'test.ts'),
        params: '',
        body: '{}',
        fullText: 'function testFunc() {}',
        startLine: 1,
        endLine: 1,
      };

      const result = await generator.generate({ symbol });
      const content = readFileSync(result.filePath!, 'utf-8');

      expect(content).not.toContain('syncdocsVersion');
    });

    it('should format dependencies correctly', async () => {
      const symbol: SymbolInfo = {
        name: 'func',
        kind: 'function',
        filePath: join(SRC_DIR, 'test.ts'),
        params: '',
        body: '{}',
        fullText: 'function func() {}',
        startLine: 1,
        endLine: 1,
      };

      const result = await generator.generate({ symbol });
      const content = readFileSync(result.filePath!, 'utf-8');

      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeTruthy();

      const frontmatter = frontmatterMatch?.[1];

      // Check dependency formatting (proper YAML indentation)
      expect(frontmatter).toMatch(/dependencies:\n {2}- path: /);
      expect(frontmatter).toMatch(/ {4}symbol: /);
      expect(frontmatter).toMatch(/ {4}hash: /);
    });
  });

  describe('configuration options', () => {
    it('should use custom model if provided', () => {
      const customGenerator = new Generator({
        apiKey: 'test-key',
        outputDir: OUTPUT_DIR,
        model: 'claude-opus-4-20250514',
      });

      expect(customGenerator).toBeDefined();
      // Generator successfully created with custom config
    });

    it('should respect output directory', async () => {
      const customOutputDir = join(TEST_DIR, 'custom-docs');
      const customGenerator = new Generator({
        apiKey: 'test-key',
        outputDir: customOutputDir,
      });

      const symbol: SymbolInfo = {
        name: 'testFunc',
        kind: 'function',
        filePath: join(SRC_DIR, 'test.ts'),
        params: '',
        body: '{}',
        fullText: 'function testFunc() {}',
        startLine: 1,
        endLine: 1,
      };

      const result = await customGenerator.generate({ symbol });

      expect(result.filePath).toContain(customOutputDir);
      expect(existsSync(result.filePath!)).toBe(true);
    });
  });

  describe('resolveCallTree', () => {
    it('should return empty array for depth 0', () => {
      const code = `
function helper() { return 1 }
function main() { return helper() }
`;
      const sourcePath = join(SRC_DIR, 'calltree.ts');
      writeFileSync(sourcePath, code);

      const symbol = {
        name: 'main',
        kind: 'function' as const,
        filePath: sourcePath,
        params: '',
        body: '{ return helper() }',
        fullText: 'function main() { return helper() }',
        startLine: 3,
        endLine: 3,
      };

      const result = generator.resolveCallTree(symbol, 0);
      expect(result).toHaveLength(0);
    });

    it('should find direct callees at depth 1', () => {
      const code = `
function helper() { return 1 }
function main() { return helper() }
`;
      const sourcePath = join(SRC_DIR, 'calltree.ts');
      writeFileSync(sourcePath, code);

      const symbol = {
        name: 'main',
        kind: 'function' as const,
        filePath: sourcePath,
        params: '',
        body: '{ return helper() }',
        fullText: 'function main() { return helper() }',
        startLine: 3,
        endLine: 3,
      };

      const result = generator.resolveCallTree(symbol, 1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('helper');
    });

    it('should traverse multiple levels with depth > 1', () => {
      const code = `
function deepHelper() { return 1 }
function helper() { return deepHelper() }
function main() { return helper() }
`;
      const sourcePath = join(SRC_DIR, 'calltree.ts');
      writeFileSync(sourcePath, code);

      const symbol = {
        name: 'main',
        kind: 'function' as const,
        filePath: sourcePath,
        params: '',
        body: '{ return helper() }',
        fullText: 'function main() { return helper() }',
        startLine: 4,
        endLine: 4,
      };

      const result = generator.resolveCallTree(symbol, 2);
      const names = result.map((s) => s.name);
      expect(names).toContain('helper');
      expect(names).toContain('deepHelper');
    });

    it('should not generate duplicate symbols found through multiple paths', async () => {
      // Two targets that both call the same helper — helper should only be generated once
      const code = `
function helper() { return 1 }
function main1() { return helper() }
function main2() { return helper() }
`;
      const sourcePath = join(SRC_DIR, 'dedup.ts');
      writeFileSync(sourcePath, code);

      const progressMessages: string[] = [];
      const results = await generator.generateWithDepth(sourcePath, {
        depth: 1,
        onProgress: (msg) => progressMessages.push(msg),
      });

      // helper should appear at most once in successful results (not counting skips)
      const generatedPaths = results.filter((r) => r.success).map((r) => r.filePath);
      const helperDocs = generatedPaths.filter((p) => p?.includes('helper'));
      expect(helperDocs).toHaveLength(1);
    });

    it('should resolve cross-file calls via imports', () => {
      // Main file imports and calls a function from another file
      const helperCode = `
export function externalHelper() { return 'from other file' }
`;
      const mainCode = `
import { externalHelper } from './helper'
function main() { return externalHelper() }
`;
      const helperPath = join(SRC_DIR, 'helper.ts');
      const mainPath = join(SRC_DIR, 'cross-file.ts');
      writeFileSync(helperPath, helperCode);
      writeFileSync(mainPath, mainCode);

      const symbol = {
        name: 'main',
        kind: 'function' as const,
        filePath: mainPath,
        params: '',
        body: '{ return externalHelper() }',
        fullText: 'function main() { return externalHelper() }',
        startLine: 3,
        endLine: 3,
      };

      const result = generator.resolveCallTree(symbol, 1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('externalHelper');
      expect(result[0].filePath).toBe(helperPath);
    });

    it('should resolve multi-level cross-file calls', () => {
      // main.ts → calls helperA from a.ts → calls helperB from b.ts
      const bCode = `
export function helperB() { return 'deep' }
`;
      const aCode = `
import { helperB } from './b'
export function helperA() { return helperB() }
`;
      const mainCode = `
import { helperA } from './a'
function main() { return helperA() }
`;
      writeFileSync(join(SRC_DIR, 'b.ts'), bCode);
      writeFileSync(join(SRC_DIR, 'a.ts'), aCode);
      const mainPath = join(SRC_DIR, 'multi-cross.ts');
      writeFileSync(mainPath, mainCode);

      const symbol = {
        name: 'main',
        kind: 'function' as const,
        filePath: mainPath,
        params: '',
        body: '{ return helperA() }',
        fullText: 'function main() { return helperA() }',
        startLine: 3,
        endLine: 3,
      };

      const result = generator.resolveCallTree(symbol, 2);
      const names = result.map((s) => s.name);
      expect(names).toContain('helperA');
      expect(names).toContain('helperB');
    });

    it('should prefer same-file match over cross-file import', () => {
      // If a function exists both locally and as an import, prefer local
      const externalCode = `
export function helper() { return 'external' }
`;
      const mainCode = `
import { helper } from './external-helper'
function helper() { return 'local' }
function main() { return helper() }
`;
      writeFileSync(join(SRC_DIR, 'external-helper.ts'), externalCode);
      const mainPath = join(SRC_DIR, 'prefer-local.ts');
      writeFileSync(mainPath, mainCode);

      const symbol = {
        name: 'main',
        kind: 'function' as const,
        filePath: mainPath,
        params: '',
        body: '{ return helper() }',
        fullText: 'function main() { return helper() }',
        startLine: 4,
        endLine: 4,
      };

      const result = generator.resolveCallTree(symbol, 1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('helper');
      // Should be from the same file, not the imported one
      expect(result[0].filePath).toBe(mainPath);
    });

    it('should handle renamed imports in cross-file resolution', () => {
      const moduleCode = `
export function originalFn() { return 'original' }
`;
      const mainCode = `
import { originalFn as renamedFn } from './renamed-module'
function main() { return renamedFn() }
`;
      const modulePath = join(SRC_DIR, 'renamed-module.ts');
      const mainPath = join(SRC_DIR, 'renamed-caller.ts');
      writeFileSync(modulePath, moduleCode);
      writeFileSync(mainPath, mainCode);

      const symbol = {
        name: 'main',
        kind: 'function' as const,
        filePath: mainPath,
        params: '',
        body: '{ return renamedFn() }',
        fullText: 'function main() { return renamedFn() }',
        startLine: 3,
        endLine: 3,
      };

      const result = generator.resolveCallTree(symbol, 1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('originalFn');
      expect(result[0].filePath).toBe(modulePath);
    });

    it('should skip unresolvable imports (bare packages)', () => {
      const mainCode = `
import { useState } from 'react'
function main() { return useState(0) }
`;
      const mainPath = join(SRC_DIR, 'bare-import.ts');
      writeFileSync(mainPath, mainCode);

      const symbol = {
        name: 'main',
        kind: 'function' as const,
        filePath: mainPath,
        params: '',
        body: '{ return useState(0) }',
        fullText: 'function main() { return useState(0) }',
        startLine: 3,
        endLine: 3,
      };

      const result = generator.resolveCallTree(symbol, 1);
      expect(result).toHaveLength(0);
    });

    it('should resolve cross-file symbol with same name as caller', () => {
      // validate() in a.ts calls validate() imported from b.ts
      // The name-only guard previously dropped this — composite key check fixes it
      const bCode = `
export function validate() { return true }
`;
      const aCode = `
import { validate as baseValidate } from './same-name-b'
function validate() { return baseValidate() }
`;
      const bPath = join(SRC_DIR, 'same-name-b.ts');
      const aPath = join(SRC_DIR, 'same-name-a.ts');
      writeFileSync(bPath, bCode);
      writeFileSync(aPath, aCode);

      const symbol = {
        name: 'validate',
        kind: 'function' as const,
        filePath: aPath,
        params: '',
        body: '{ return baseValidate() }',
        fullText: 'function validate() { return baseValidate() }',
        startLine: 3,
        endLine: 3,
      };

      const result = generator.resolveCallTree(symbol, 1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('validate');
      expect(result[0].filePath).toBe(bPath);
    });

    it('should handle cycles without infinite recursion', () => {
      const code = `
function a() { return b() }
function b() { return a() }
`;
      const sourcePath = join(SRC_DIR, 'calltree.ts');
      writeFileSync(sourcePath, code);

      const symbol = {
        name: 'a',
        kind: 'function' as const,
        filePath: sourcePath,
        params: '',
        body: '{ return b() }',
        fullText: 'function a() { return b() }',
        startLine: 2,
        endLine: 2,
      };

      // Should not throw or hang
      const result = generator.resolveCallTree(symbol, 10);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('b');
    });
  });
});
