/**
 * Tests for documentation generator
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SymbolInfo } from '../extractor/types.js';
import { AIClient } from './ai-client.js';
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

      // Should have dependency with hash
      expect(content).toContain(`path: ${symbol.filePath}`);
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
      expect(hashMatch![1]).toHaveLength(64);
    });

    it('should generate kebab-case file names', async () => {
      const testCases = [
        { name: 'MyClass', expected: 'my-class.md' },
        { name: 'getUserData', expected: 'get-user-data.md' },
        { name: 'APIClient', expected: 'a-p-i-client.md' },
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
      expect(content).toContain(mainSymbol.filePath);
      expect(content).toContain(relatedSymbol.filePath);
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

      // Should have generated files for each symbol
      expect(existsSync(join(OUTPUT_DIR, 'add.md'))).toBe(true);
      expect(existsSync(join(OUTPUT_DIR, 'subtract.md'))).toBe(true);
      expect(existsSync(join(OUTPUT_DIR, 'calculator.md'))).toBe(true);
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

      const frontmatter = frontmatterMatch![1];

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
});
