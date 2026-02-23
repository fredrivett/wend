/**
 * Tests for staleness checker
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TypeScriptExtractor } from '../extractor/index.js';
import { ContentHasher } from '../hasher/index.js';
import { DocParser, StaleChecker } from './index.js';

const TEST_DIR = join(process.cwd(), '.test-checker');
const DOCS_DIR = join(TEST_DIR, '_syncdocs');
const SRC_DIR = join(TEST_DIR, 'src');

describe('DocParser', () => {
  let parser: DocParser;

  beforeEach(() => {
    parser = new DocParser();

    // Create test directory
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should parse doc frontmatter correctly', () => {
    const content = `---
title: Test Doc
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: src/test.ts
    symbol: testFunc
    hash: abc123
    asOf: commit123
---

# Test Doc

Some content here.
`;

    writeFileSync(join(TEST_DIR, 'test.md'), content);
    const metadata = parser.parseDocFile(join(TEST_DIR, 'test.md'));

    expect(metadata.title).toBe('Test Doc');
    expect(metadata.generated).toBe('2026-02-03T10:00:00Z');
    expect(metadata.dependencies).toHaveLength(1);
    expect(metadata.dependencies[0]).toEqual({
      path: 'src/test.ts',
      symbol: 'testFunc',
      hash: 'abc123',
      asOf: 'commit123',
    });
  });

  it('should parse multiple dependencies', () => {
    const content = `---
title: Multi Dep Doc
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: src/a.ts
    symbol: funcA
    hash: hash1
  - path: src/b.ts
    symbol: funcB
    hash: hash2
    asOf: commit456
---

Content
`;

    writeFileSync(join(TEST_DIR, 'multi.md'), content);
    const metadata = parser.parseDocFile(join(TEST_DIR, 'multi.md'));

    expect(metadata.dependencies).toHaveLength(2);
    expect(metadata.dependencies[0].symbol).toBe('funcA');
    expect(metadata.dependencies[1].symbol).toBe('funcB');
    expect(metadata.dependencies[1].asOf).toBe('commit456');
  });

  it('should parse syncdocsVersion from frontmatter', () => {
    const content = `---
title: Test Doc
syncdocsVersion: 0.1.0
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: src/test.ts
    symbol: testFunc
    hash: abc123
---

# Test Doc

Some content here.
`;

    writeFileSync(join(TEST_DIR, 'versioned.md'), content);
    const metadata = parser.parseDocFile(join(TEST_DIR, 'versioned.md'));

    expect(metadata.syncdocsVersion).toBe('0.1.0');
  });

  it('should handle missing syncdocsVersion gracefully', () => {
    const content = `---
title: Test Doc
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: src/test.ts
    symbol: testFunc
    hash: abc123
---

Content
`;

    writeFileSync(join(TEST_DIR, 'no-version.md'), content);
    const metadata = parser.parseDocFile(join(TEST_DIR, 'no-version.md'));

    expect(metadata.syncdocsVersion).toBeUndefined();
  });

  it('should handle dependency without asOf field', () => {
    const content = `---
title: Test
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: src/test.ts
    symbol: func
    hash: abc
---

Content
`;

    writeFileSync(join(TEST_DIR, 'no-asof.md'), content);
    const metadata = parser.parseDocFile(join(TEST_DIR, 'no-asof.md'));

    expect(metadata.dependencies[0].asOf).toBeUndefined();
  });

  it('should parse badge metadata from frontmatter', () => {
    const content = `---
title: DashboardDropzone
kind: component
exported: true
async: true
deprecated: Use FileUploadZone instead
filePath: src/dashboard-dropzone.tsx
lineRange: 19-118
entryType: api-route
httpMethod: GET
route: /api/dashboard/upload
eventTrigger: upload.completed
taskId: process-upload
generated: 2026-02-21T15:55:00.000Z
dependencies:
  - path: src/dashboard-dropzone.tsx
    symbol: DashboardDropzone
    hash: abc123
---

# DashboardDropzone
`;

    writeFileSync(join(TEST_DIR, 'badges.md'), content);
    const metadata = parser.parseDocFile(join(TEST_DIR, 'badges.md'));

    expect(metadata.kind).toBe('component');
    expect(metadata.exported).toBe(true);
    expect(metadata.isAsync).toBe(true);
    expect(metadata.deprecated).toBe('Use FileUploadZone instead');
    expect(metadata.filePath).toBe('src/dashboard-dropzone.tsx');
    expect(metadata.lineRange).toBe('19-118');
    expect(metadata.entryType).toBe('api-route');
    expect(metadata.httpMethod).toBe('GET');
    expect(metadata.route).toBe('/api/dashboard/upload');
    expect(metadata.eventTrigger).toBe('upload.completed');
    expect(metadata.taskId).toBe('process-upload');
  });

  it('should parse deprecated: true as boolean', () => {
    const content = `---
title: OldFunc
deprecated: true
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: src/old.ts
    symbol: OldFunc
    hash: abc
---

Content
`;

    writeFileSync(join(TEST_DIR, 'dep-bool.md'), content);
    const metadata = parser.parseDocFile(join(TEST_DIR, 'dep-bool.md'));

    expect(metadata.deprecated).toBe(true);
  });

  it('should leave badge fields undefined when absent', () => {
    const content = `---
title: SimpleFunc
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: src/simple.ts
    symbol: SimpleFunc
    hash: abc
---

Content
`;

    writeFileSync(join(TEST_DIR, 'no-badges.md'), content);
    const metadata = parser.parseDocFile(join(TEST_DIR, 'no-badges.md'));

    expect(metadata.kind).toBeUndefined();
    expect(metadata.exported).toBeUndefined();
    expect(metadata.isAsync).toBeUndefined();
    expect(metadata.deprecated).toBeUndefined();
    expect(metadata.filePath).toBeUndefined();
    expect(metadata.lineRange).toBeUndefined();
    expect(metadata.entryType).toBeUndefined();
    expect(metadata.httpMethod).toBeUndefined();
    expect(metadata.route).toBeUndefined();
    expect(metadata.eventTrigger).toBeUndefined();
    expect(metadata.taskId).toBeUndefined();
  });
});

describe('StaleChecker', () => {
  let checker: StaleChecker;

  beforeEach(() => {
    checker = new StaleChecker();

    // Clean up and create test directories
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(DOCS_DIR, { recursive: true });
    mkdirSync(SRC_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('checkDoc', () => {
    it('should detect up-to-date doc', () => {
      // Create source file
      const sourceCode = `
export function add(a: number, b: number): number {
  return a + b
}
`;
      const sourcePath = join(SRC_DIR, 'math.ts');
      writeFileSync(sourcePath, sourceCode);

      // Extract and hash the function to get correct hash
      const extractor = new TypeScriptExtractor();
      const hasher = new ContentHasher();
      // biome-ignore lint/style/noNonNullAssertion: test file, symbol is known to exist
      const symbol = extractor.extractSymbol(sourcePath, 'add')!;
      const correctHash = hasher.hashSymbol(symbol);

      // Create doc with matching hash
      const docContent = `---
title: Add Function
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: ${sourcePath}
    symbol: add
    hash: ${correctHash}
---

# Add Function

Adds two numbers.
`;
      const docPath = join(DOCS_DIR, 'add.md');
      writeFileSync(docPath, docContent);

      const result = checker.checkDoc(docPath);
      expect(result).toBeNull(); // Up to date
    });

    it('should detect stale doc when code changes', () => {
      const sourcePath = join(SRC_DIR, 'math.ts');

      // Create original source
      writeFileSync(sourcePath, 'export function add(a: number, b: number) { return a + b }');

      // Create doc with OLD hash
      const docContent = `---
title: Add Function
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: ${sourcePath}
    symbol: add
    hash: old_hash_that_wont_match
---

Content
`;
      const docPath = join(DOCS_DIR, 'add.md');
      writeFileSync(docPath, docContent);

      const result = checker.checkDoc(docPath);
      expect(result).not.toBeNull();
      expect(result?.staleDependencies).toHaveLength(1);
      expect(result?.staleDependencies[0].reason).toBe('changed');
      expect(result?.staleDependencies[0].oldHash).toBe('old_hash_that_wont_match');
      expect(result?.staleDependencies[0].newHash).not.toBe('old_hash_that_wont_match');
    });

    it('should detect missing symbol', () => {
      const sourcePath = join(SRC_DIR, 'test.ts');
      writeFileSync(sourcePath, 'export function other() { return 1 }');

      const docContent = `---
title: Missing Symbol
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: ${sourcePath}
    symbol: doesNotExist
    hash: abc123
---

Content
`;
      const docPath = join(DOCS_DIR, 'missing.md');
      writeFileSync(docPath, docContent);

      const result = checker.checkDoc(docPath);
      expect(result).not.toBeNull();
      expect(result?.staleDependencies[0].reason).toBe('not-found');
    });

    it('should detect missing file', () => {
      const docContent = `---
title: Missing File
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: /does/not/exist.ts
    symbol: someFunc
    hash: abc123
---

Content
`;
      const docPath = join(DOCS_DIR, 'missing-file.md');
      writeFileSync(docPath, docContent);

      const result = checker.checkDoc(docPath);
      expect(result).not.toBeNull();
      expect(result?.staleDependencies[0].reason).toBe('file-not-found');
    });

    it('should detect multiple stale dependencies', () => {
      const source1 = join(SRC_DIR, 'a.ts');
      const source2 = join(SRC_DIR, 'b.ts');

      writeFileSync(source1, 'export function funcA() { return 1 }');
      writeFileSync(source2, 'export function funcB() { return 2 }');

      const docContent = `---
title: Multiple Deps
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: ${source1}
    symbol: funcA
    hash: wrong_hash_1
  - path: ${source2}
    symbol: funcB
    hash: wrong_hash_2
---

Content
`;
      const docPath = join(DOCS_DIR, 'multi.md');
      writeFileSync(docPath, docContent);

      const result = checker.checkDoc(docPath);
      expect(result).not.toBeNull();
      expect(result?.staleDependencies).toHaveLength(2);
    });
  });

  describe('checkDocs', () => {
    it('should check all docs in directory', () => {
      const sourcePath = join(SRC_DIR, 'test.ts');
      writeFileSync(sourcePath, 'export function test() { return 1 }');

      // Create two docs: one stale, one up-to-date
      const extractor = new TypeScriptExtractor();
      const hasher = new ContentHasher();
      // biome-ignore lint/style/noNonNullAssertion: test file, symbol is known to exist
      const symbol = extractor.extractSymbol(sourcePath, 'test')!;
      const correctHash = hasher.hashSymbol(symbol);

      // Up-to-date doc
      writeFileSync(
        join(DOCS_DIR, 'uptodate.md'),
        `---
title: Up to date
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: ${sourcePath}
    symbol: test
    hash: ${correctHash}
---
Content`,
      );

      // Stale doc
      writeFileSync(
        join(DOCS_DIR, 'stale.md'),
        `---
title: Stale
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: ${sourcePath}
    symbol: test
    hash: wrong_hash
---
Content`,
      );

      const result = checker.checkDocs(DOCS_DIR);
      expect(result.totalDocs).toBe(2);
      expect(result.staleDocs).toHaveLength(1);
      expect(result.upToDate).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle non-existent docs directory', () => {
      const result = checker.checkDocs('/does/not/exist');
      expect(result.errors).toHaveLength(1);
      expect(result.totalDocs).toBe(0);
    });

    it('should find docs in subdirectories', () => {
      const sourcePath = join(SRC_DIR, 'test.ts');
      writeFileSync(sourcePath, 'export function test() { return 1 }');

      const extractor = new TypeScriptExtractor();
      const hasher = new ContentHasher();
      // biome-ignore lint/style/noNonNullAssertion: test file, symbol is known to exist
      const symbol = extractor.extractSymbol(sourcePath, 'test')!;
      const correctHash = hasher.hashSymbol(symbol);

      // Create docs in subdirectories
      mkdirSync(join(DOCS_DIR, 'blocks'), { recursive: true });
      mkdirSync(join(DOCS_DIR, 'functionality'), { recursive: true });

      writeFileSync(
        join(DOCS_DIR, 'blocks', 'doc1.md'),
        `---
title: Doc 1
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: ${sourcePath}
    symbol: test
    hash: ${correctHash}
---
Content`,
      );

      writeFileSync(
        join(DOCS_DIR, 'functionality', 'doc2.md'),
        `---
title: Doc 2
generated: 2026-02-03T10:00:00Z
dependencies:
  - path: ${sourcePath}
    symbol: test
    hash: ${correctHash}
---
Content`,
      );

      const result = checker.checkDocs(DOCS_DIR);
      expect(result.totalDocs).toBe(2);
    });

    it('should skip config.yaml and non-markdown files', () => {
      writeFileSync(join(DOCS_DIR, 'config.yaml'), 'some: config');
      writeFileSync(join(DOCS_DIR, 'README.txt'), 'text file');

      const result = checker.checkDocs(DOCS_DIR);
      expect(result.totalDocs).toBe(0);
    });
  });
});
