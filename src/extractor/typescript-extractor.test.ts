/**
 * Tests for TypeScript/JavaScript symbol extractor
 */

import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TypeScriptExtractor } from './typescript-extractor.js';

const TEST_DIR = join(process.cwd(), '.test-tmp');
const TEST_FILE = join(TEST_DIR, 'test.ts');
const TEST_TSX_FILE = join(TEST_DIR, 'test.tsx');

describe('TypeScriptExtractor', () => {
  let extractor: TypeScriptExtractor;

  beforeEach(() => {
    extractor = new TypeScriptExtractor();
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    try {
      if (existsSync(TEST_FILE)) unlinkSync(TEST_FILE);
      if (existsSync(TEST_TSX_FILE)) unlinkSync(TEST_TSX_FILE);
    } catch (_e) {
      // Ignore cleanup errors
    }
  });

  describe('Function Declarations', () => {
    it('should extract basic function declaration', () => {
      const code = `
function add(a: number, b: number): number {
  return a + b
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0]).toMatchObject({
        name: 'add',
        kind: 'function',
        params: 'a: number, b: number',
      });
      expect(result.symbols[0].body).toContain('return a + b');
    });

    it('should extract async function', () => {
      const code = `
async function fetchData(url: string) {
  const response = await fetch(url)
  return response.json()
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0]).toMatchObject({
        name: 'fetchData',
        kind: 'function',
        params: 'url: string',
      });
    });

    it('should extract exported function', () => {
      const code = `
export function greet(name: string): string {
  return \`Hello, \${name}!\`
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].name).toBe('greet');
    });

    it('should extract function with no parameters', () => {
      const code = `
function getCurrentTime() {
  return Date.now()
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0]).toMatchObject({
        name: 'getCurrentTime',
        params: '',
      });
    });

    it('should extract function with complex parameters', () => {
      const code = `
function process(
  data: string[],
  options: { timeout: number; retry: boolean } = { timeout: 5000, retry: true }
): Promise<void> {
  // processing
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].params).toContain('data: string[]');
      expect(result.symbols[0].params).toContain('options');
    });
  });

  describe('Arrow Functions', () => {
    it('should extract const arrow function', () => {
      const code = `
const multiply = (a: number, b: number) => {
  return a * b
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0]).toMatchObject({
        name: 'multiply',
        kind: 'const',
        params: 'a: number, b: number',
      });
      expect(result.symbols[0].body).toContain('return a * b');
    });

    it('should extract arrow function with implicit return', () => {
      const code = `
const square = (x: number) => x * x
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0]).toMatchObject({
        name: 'square',
        kind: 'const',
        params: 'x: number',
      });
      // Implicit return should be wrapped in block
      expect(result.symbols[0].body).toContain('return');
      expect(result.symbols[0].body).toContain('x * x');
    });

    it('should extract async arrow function', () => {
      const code = `
const fetchUser = async (id: string) => {
  const response = await fetch(\`/api/users/\${id}\`)
  return response.json()
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].name).toBe('fetchUser');
    });

    it('should extract arrow function with no parameters', () => {
      const code = `
const getTimestamp = () => Date.now()
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0]).toMatchObject({
        name: 'getTimestamp',
        params: '',
      });
    });
  });

  describe('Function Expressions', () => {
    it('should extract function expression', () => {
      const code = `
const divide = function(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero')
  return a / b
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0]).toMatchObject({
        name: 'divide',
        kind: 'const',
        params: 'a: number, b: number',
      });
    });
  });

  describe('Classes', () => {
    it('should extract basic class', () => {
      const code = `
class Calculator {
  add(a: number, b: number): number {
    return a + b
  }

  subtract(a: number, b: number): number {
    return a - b
  }
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0]).toMatchObject({
        name: 'Calculator',
        kind: 'class',
        params: '',
      });
      expect(result.symbols[0].body).toContain('add');
      expect(result.symbols[0].body).toContain('subtract');
    });

    it('should extract exported class', () => {
      const code = `
export class UserService {
  private users: User[] = []

  addUser(user: User): void {
    this.users.push(user)
  }
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].name).toBe('UserService');
    });

    it('should extract class with constructor', () => {
      const code = `
class Person {
  constructor(public name: string, public age: number) {}

  greet(): string {
    return \`Hello, I'm \${this.name}\`
  }
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].body).toContain('constructor');
      expect(result.symbols[0].body).toContain('greet');
    });
  });

  describe('Multiple Symbols', () => {
    it('should extract all symbols from a file', () => {
      const code = `
function regularFunc() {
  return 'regular'
}

const arrowFunc = () => 'arrow'

class MyClass {
  method() {}
}

export function exportedFunc() {
  return 'exported'
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(4);
      expect(result.symbols.map((s) => s.name)).toEqual([
        'regularFunc',
        'arrowFunc',
        'MyClass',
        'exportedFunc',
      ]);
    });
  });

  describe('extractSymbol (single symbol)', () => {
    it('should extract specific symbol by name', () => {
      const code = `
function first() { return 1 }
function second() { return 2 }
function third() { return 3 }
`;
      writeFileSync(TEST_FILE, code);

      const symbol = extractor.extractSymbol(TEST_FILE, 'second');

      expect(symbol).not.toBeNull();
      expect(symbol?.name).toBe('second');
      expect(symbol?.body).toContain('return 2');
    });

    it('should return null for non-existent symbol', () => {
      const code = `
function exists() { return true }
`;
      writeFileSync(TEST_FILE, code);

      const symbol = extractor.extractSymbol(TEST_FILE, 'doesNotExist');

      expect(symbol).toBeNull();
    });
  });

  describe('Line Numbers', () => {
    it('should track correct line numbers', () => {
      const code = `// Line 1
// Line 2
function myFunc() {
  // Line 4
  return 'hello'
  // Line 6
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].startLine).toBeGreaterThan(0);
      expect(result.symbols[0].endLine).toBeGreaterThan(result.symbols[0].startLine);
    });
  });

  describe('Error Handling', () => {
    it('should handle file with syntax errors gracefully', () => {
      const code = `
function broken( {
  // Syntax error: missing closing paren
  return 'oops'
}
`;
      writeFileSync(TEST_FILE, code);

      // Should not throw, but might return empty or partial results
      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toBeDefined();
      expect(Array.isArray(result.symbols)).toBe(true);
    });

    it('should throw ExtractionError for non-existent file', () => {
      expect(() => {
        extractor.extractSymbols('/non/existent/file.ts');
      }).toThrow();
    });
  });

  describe('Real-world Examples', () => {
    it('should extract from complex real-world code', () => {
      const code = `
import { useState, useEffect } from 'react'

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(2);
      expect(result.symbols[0].name).toBe('useDebounce');
      expect(result.symbols[1].name).toBe('formatCurrency');
    });
  });

  describe('extractCallSites', () => {
    it('should find direct function calls', () => {
      const code = `
function helper() { return 1 }
function main() {
  const x = helper()
  return x
}
`;
      writeFileSync(TEST_FILE, code);

      const calls = extractor.extractCallSites(TEST_FILE, 'main');

      expect(calls).toHaveLength(1);
      expect(calls[0].name).toBe('helper');
      expect(calls[0].expression).toBe('helper');
    });

    it('should find method calls', () => {
      const code = `
function process(items: any[]) {
  items.map(x => x)
  items.filter(Boolean)
  console.log('done')
}
`;
      writeFileSync(TEST_FILE, code);

      const calls = extractor.extractCallSites(TEST_FILE, 'process');
      const names = calls.map((c) => c.name);

      expect(names).toContain('map');
      expect(names).toContain('filter');
      expect(names).toContain('log');
    });

    it('should not duplicate calls to the same function', () => {
      const code = `
function helper() { return 1 }
function main() {
  helper()
  helper()
  helper()
}
`;
      writeFileSync(TEST_FILE, code);

      const calls = extractor.extractCallSites(TEST_FILE, 'main');

      expect(calls).toHaveLength(1);
      expect(calls[0].name).toBe('helper');
    });

    it('should return empty for functions with no calls', () => {
      const code = `
function simple() {
  return 42
}
`;
      writeFileSync(TEST_FILE, code);

      const calls = extractor.extractCallSites(TEST_FILE, 'simple');

      expect(calls).toHaveLength(0);
    });

    it('should return empty for non-existent symbol', () => {
      const code = `function exists() { return 1 }`;
      writeFileSync(TEST_FILE, code);

      const calls = extractor.extractCallSites(TEST_FILE, 'doesNotExist');

      expect(calls).toHaveLength(0);
    });

    it('should find calls in arrow functions', () => {
      const code = `
function doWork() { return 'work' }
const main = () => {
  return doWork()
}
`;
      writeFileSync(TEST_FILE, code);

      const calls = extractor.extractCallSites(TEST_FILE, 'main');

      expect(calls).toHaveLength(1);
      expect(calls[0].name).toBe('doWork');
    });

    it('should find calls in class methods', () => {
      const code = `
function validate() { return true }
class Processor {
  run() {
    const valid = validate()
    this.cleanup()
  }
  cleanup() {}
}
`;
      writeFileSync(TEST_FILE, code);

      const calls = extractor.extractCallSites(TEST_FILE, 'Processor');
      const names = calls.map((c) => c.name);

      expect(names).toContain('validate');
      expect(names).toContain('cleanup');
    });

    it('should find calls inside call expression initializers (e.g. task())', () => {
      const code = `
function analyzeImage() { return 'result' }
function getConfig() { return {} }
const analyzeImageTask = task({
  id: "analyze-image",
  run: async () => {
    const config = getConfig()
    const result = analyzeImage()
    return result
  }
})
`;
      writeFileSync(TEST_FILE, code);

      const calls = extractor.extractCallSites(TEST_FILE, 'analyzeImageTask');
      const names = calls.map((c) => c.name);

      expect(names).toContain('task');
      expect(names).toContain('getConfig');
      expect(names).toContain('analyzeImage');
    });
  });

  describe('extractImports', () => {
    it('should extract named imports', () => {
      const code = `
import { foo, bar } from './utils'
`;
      writeFileSync(TEST_FILE, code);

      const imports = extractor.extractImports(TEST_FILE);

      expect(imports).toHaveLength(2);
      expect(imports[0]).toMatchObject({
        name: 'foo',
        originalName: 'foo',
        source: './utils',
        isDefault: false,
      });
      expect(imports[1]).toMatchObject({
        name: 'bar',
        originalName: 'bar',
        source: './utils',
        isDefault: false,
      });
    });

    it('should extract default imports', () => {
      const code = `
import MyModule from './my-module'
`;
      writeFileSync(TEST_FILE, code);

      const imports = extractor.extractImports(TEST_FILE);

      expect(imports).toHaveLength(1);
      expect(imports[0]).toMatchObject({
        name: 'MyModule',
        originalName: 'MyModule',
        source: './my-module',
        isDefault: true,
      });
    });

    it('should extract both default and named imports from same declaration', () => {
      const code = `
import React, { useState, useEffect } from 'react'
`;
      writeFileSync(TEST_FILE, code);

      const imports = extractor.extractImports(TEST_FILE);

      expect(imports).toHaveLength(3);
      expect(imports[0]).toMatchObject({ name: 'React', isDefault: true });
      expect(imports[1]).toMatchObject({ name: 'useState', isDefault: false });
      expect(imports[2]).toMatchObject({ name: 'useEffect', isDefault: false });
    });

    it('should skip type-only imports', () => {
      const code = `
import type { Foo } from './types'
import { bar } from './utils'
`;
      writeFileSync(TEST_FILE, code);

      const imports = extractor.extractImports(TEST_FILE);

      expect(imports).toHaveLength(1);
      expect(imports[0].name).toBe('bar');
    });

    it('should skip individual type-only elements', () => {
      const code = `
import { type Foo, bar, type Baz } from './mixed'
`;
      writeFileSync(TEST_FILE, code);

      const imports = extractor.extractImports(TEST_FILE);

      expect(imports).toHaveLength(1);
      expect(imports[0].name).toBe('bar');
    });

    it('should handle renamed imports with originalName', () => {
      const code = `
import { originalName as localName } from './module'
`;
      writeFileSync(TEST_FILE, code);

      const imports = extractor.extractImports(TEST_FILE);

      expect(imports).toHaveLength(1);
      expect(imports[0]).toMatchObject({
        name: 'localName',
        originalName: 'originalName',
        source: './module',
        isDefault: false,
      });
    });

    it('should skip side-effect imports', () => {
      const code = `
import './side-effect'
import { foo } from './utils'
`;
      writeFileSync(TEST_FILE, code);

      const imports = extractor.extractImports(TEST_FILE);

      expect(imports).toHaveLength(1);
      expect(imports[0].name).toBe('foo');
    });

    it('should handle imports from multiple sources', () => {
      const code = `
import { a } from './file-a'
import { b } from './file-b'
import { c } from '@/lib/file-c'
`;
      writeFileSync(TEST_FILE, code);

      const imports = extractor.extractImports(TEST_FILE);

      expect(imports).toHaveLength(3);
      expect(imports[0]).toMatchObject({ name: 'a', source: './file-a' });
      expect(imports[1]).toMatchObject({ name: 'b', source: './file-b' });
      expect(imports[2]).toMatchObject({ name: 'c', source: '@/lib/file-c' });
    });

    it('should return empty array for file with no imports', () => {
      const code = `
function standalone() { return 42 }
`;
      writeFileSync(TEST_FILE, code);

      const imports = extractor.extractImports(TEST_FILE);

      expect(imports).toHaveLength(0);
    });
  });

  describe('extractReExports', () => {
    it('should extract named re-exports', () => {
      const code = `
export { useSearch } from "./use-search"
export { parseParams, createFilter } from "./types"
`;
      writeFileSync(TEST_FILE, code);

      const reExports = extractor.extractReExports(TEST_FILE);

      expect(reExports).toHaveLength(3);
      expect(reExports[0]).toMatchObject({
        localName: 'useSearch',
        originalName: 'useSearch',
        source: './use-search',
      });
      expect(reExports[1]).toMatchObject({
        localName: 'parseParams',
        originalName: 'parseParams',
        source: './types',
      });
    });

    it('should handle renamed re-exports', () => {
      const code = `
export { internalFn as publicFn } from "./internal"
`;
      writeFileSync(TEST_FILE, code);

      const reExports = extractor.extractReExports(TEST_FILE);

      expect(reExports).toHaveLength(1);
      expect(reExports[0]).toMatchObject({
        localName: 'publicFn',
        originalName: 'internalFn',
        source: './internal',
      });
    });

    it('should skip type-only re-exports', () => {
      const code = `
export type { SearchState } from "./types"
export { useSearch } from "./use-search"
`;
      writeFileSync(TEST_FILE, code);

      const reExports = extractor.extractReExports(TEST_FILE);

      expect(reExports).toHaveLength(1);
      expect(reExports[0].localName).toBe('useSearch');
    });

    it('should skip individual type-only elements in re-exports', () => {
      const code = `
export { type SearchState, useSearch } from "./use-search"
`;
      writeFileSync(TEST_FILE, code);

      const reExports = extractor.extractReExports(TEST_FILE);

      expect(reExports).toHaveLength(1);
      expect(reExports[0].localName).toBe('useSearch');
    });

    it('should return empty for files with no re-exports', () => {
      const code = `
export function foo() { return 1 }
import { bar } from "./bar"
`;
      writeFileSync(TEST_FILE, code);

      const reExports = extractor.extractReExports(TEST_FILE);

      expect(reExports).toHaveLength(0);
    });

    it('should handle mixed exports and re-exports', () => {
      const code = `
export * from "./api"
export { useSearch } from "./use-search"
export function localHelper() { return 1 }
`;
      writeFileSync(TEST_FILE, code);

      const reExports = extractor.extractReExports(TEST_FILE);

      // Only named re-exports, not star or local exports
      expect(reExports).toHaveLength(1);
      expect(reExports[0].localName).toBe('useSearch');
    });
  });

  describe('React component detection', () => {
    it('should detect function declaration component in .tsx file', () => {
      const code = `
export function UserAvatar({ name }: { name: string }) {
  return <div className="avatar">{name}</div>
}
`;
      writeFileSync(TEST_TSX_FILE, code);

      const result = extractor.extractSymbols(TEST_TSX_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].kind).toBe('component');
    });

    it('should detect arrow function component in .tsx file', () => {
      const code = `
const ProfileCard = ({ user }: Props) => {
  return <div><span>{user.name}</span></div>
}
`;
      writeFileSync(TEST_TSX_FILE, code);

      const result = extractor.extractSymbols(TEST_TSX_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].kind).toBe('component');
    });

    it('should detect component with JSX fragment', () => {
      const code = `
export function Layout({ children }: Props) {
  return <><header />{children}<footer /></>
}
`;
      writeFileSync(TEST_TSX_FILE, code);

      const result = extractor.extractSymbols(TEST_TSX_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].kind).toBe('component');
    });

    it('should NOT detect lowercase function as component', () => {
      const code = `
export function renderItem({ name }: Props) {
  return <div>{name}</div>
}
`;
      writeFileSync(TEST_TSX_FILE, code);

      const result = extractor.extractSymbols(TEST_TSX_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].kind).toBe('function');
    });

    it('should NOT detect PascalCase function in .ts file as component', () => {
      const code = `
export function CreateUser(name: string) {
  return { id: '1', name }
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].kind).toBe('function');
    });

    it('should NOT detect PascalCase function without JSX as component', () => {
      const code = `
export function FormatName(first: string, last: string) {
  return first + ' ' + last
}
`;
      writeFileSync(TEST_TSX_FILE, code);

      const result = extractor.extractSymbols(TEST_TSX_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].kind).toBe('function');
    });
  });

  describe('TypeScript-specific Features', () => {
    it('should handle generic functions', () => {
      const code = `
function identity<T>(arg: T): T {
  return arg
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].name).toBe('identity');
    });

    it('should handle type annotations', () => {
      const code = `
const processUser = (user: { id: string; name: string }): string => {
  return user.name
}
`;
      writeFileSync(TEST_FILE, code);

      const result = extractor.extractSymbols(TEST_FILE);

      expect(result.symbols).toHaveLength(1);
      expect(result.symbols[0].params).toContain('user');
    });
  });
});
