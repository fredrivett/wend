/**
 * Tests for TypeScript/JavaScript symbol extractor
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TypeScriptExtractor } from './typescript-extractor.js'
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = join(process.cwd(), '.test-tmp')
const TEST_FILE = join(TEST_DIR, 'test.ts')

describe('TypeScriptExtractor', () => {
  let extractor: TypeScriptExtractor

  beforeEach(() => {
    extractor = new TypeScriptExtractor()
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true })
    }
  })

  afterEach(() => {
    try {
      if (existsSync(TEST_FILE)) {
        unlinkSync(TEST_FILE)
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  })

  describe('Function Declarations', () => {
    it('should extract basic function declaration', () => {
      const code = `
function add(a: number, b: number): number {
  return a + b
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0]).toMatchObject({
        name: 'add',
        kind: 'function',
        params: 'a: number, b: number',
      })
      expect(result.symbols[0].body).toContain('return a + b')
    })

    it('should extract async function', () => {
      const code = `
async function fetchData(url: string) {
  const response = await fetch(url)
  return response.json()
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0]).toMatchObject({
        name: 'fetchData',
        kind: 'function',
        params: 'url: string',
      })
    })

    it('should extract exported function', () => {
      const code = `
export function greet(name: string): string {
  return \`Hello, \${name}!\`
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0].name).toBe('greet')
    })

    it('should extract function with no parameters', () => {
      const code = `
function getCurrentTime() {
  return Date.now()
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0]).toMatchObject({
        name: 'getCurrentTime',
        params: '',
      })
    })

    it('should extract function with complex parameters', () => {
      const code = `
function process(
  data: string[],
  options: { timeout: number; retry: boolean } = { timeout: 5000, retry: true }
): Promise<void> {
  // processing
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0].params).toContain('data: string[]')
      expect(result.symbols[0].params).toContain('options')
    })
  })

  describe('Arrow Functions', () => {
    it('should extract const arrow function', () => {
      const code = `
const multiply = (a: number, b: number) => {
  return a * b
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0]).toMatchObject({
        name: 'multiply',
        kind: 'const',
        params: 'a: number, b: number',
      })
      expect(result.symbols[0].body).toContain('return a * b')
    })

    it('should extract arrow function with implicit return', () => {
      const code = `
const square = (x: number) => x * x
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0]).toMatchObject({
        name: 'square',
        kind: 'const',
        params: 'x: number',
      })
      // Implicit return should be wrapped in block
      expect(result.symbols[0].body).toContain('return')
      expect(result.symbols[0].body).toContain('x * x')
    })

    it('should extract async arrow function', () => {
      const code = `
const fetchUser = async (id: string) => {
  const response = await fetch(\`/api/users/\${id}\`)
  return response.json()
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0].name).toBe('fetchUser')
    })

    it('should extract arrow function with no parameters', () => {
      const code = `
const getTimestamp = () => Date.now()
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0]).toMatchObject({
        name: 'getTimestamp',
        params: '',
      })
    })
  })

  describe('Function Expressions', () => {
    it('should extract function expression', () => {
      const code = `
const divide = function(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero')
  return a / b
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0]).toMatchObject({
        name: 'divide',
        kind: 'const',
        params: 'a: number, b: number',
      })
    })
  })

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
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0]).toMatchObject({
        name: 'Calculator',
        kind: 'class',
        params: '',
      })
      expect(result.symbols[0].body).toContain('add')
      expect(result.symbols[0].body).toContain('subtract')
    })

    it('should extract exported class', () => {
      const code = `
export class UserService {
  private users: User[] = []

  addUser(user: User): void {
    this.users.push(user)
  }
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0].name).toBe('UserService')
    })

    it('should extract class with constructor', () => {
      const code = `
class Person {
  constructor(public name: string, public age: number) {}

  greet(): string {
    return \`Hello, I'm \${this.name}\`
  }
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0].body).toContain('constructor')
      expect(result.symbols[0].body).toContain('greet')
    })
  })

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
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(4)
      expect(result.symbols.map((s) => s.name)).toEqual([
        'regularFunc',
        'arrowFunc',
        'MyClass',
        'exportedFunc',
      ])
    })
  })

  describe('extractSymbol (single symbol)', () => {
    it('should extract specific symbol by name', () => {
      const code = `
function first() { return 1 }
function second() { return 2 }
function third() { return 3 }
`
      writeFileSync(TEST_FILE, code)

      const symbol = extractor.extractSymbol(TEST_FILE, 'second')

      expect(symbol).not.toBeNull()
      expect(symbol?.name).toBe('second')
      expect(symbol?.body).toContain('return 2')
    })

    it('should return null for non-existent symbol', () => {
      const code = `
function exists() { return true }
`
      writeFileSync(TEST_FILE, code)

      const symbol = extractor.extractSymbol(TEST_FILE, 'doesNotExist')

      expect(symbol).toBeNull()
    })
  })

  describe('Line Numbers', () => {
    it('should track correct line numbers', () => {
      const code = `// Line 1
// Line 2
function myFunc() {
  // Line 4
  return 'hello'
  // Line 6
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0].startLine).toBeGreaterThan(0)
      expect(result.symbols[0].endLine).toBeGreaterThan(
        result.symbols[0].startLine
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle file with syntax errors gracefully', () => {
      const code = `
function broken( {
  // Syntax error: missing closing paren
  return 'oops'
}
`
      writeFileSync(TEST_FILE, code)

      // Should not throw, but might return empty or partial results
      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toBeDefined()
      expect(Array.isArray(result.symbols)).toBe(true)
    })

    it('should throw ExtractionError for non-existent file', () => {
      expect(() => {
        extractor.extractSymbols('/non/existent/file.ts')
      }).toThrow()
    })
  })

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
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(2)
      expect(result.symbols[0].name).toBe('useDebounce')
      expect(result.symbols[1].name).toBe('formatCurrency')
    })
  })

  describe('TypeScript-specific Features', () => {
    it('should handle generic functions', () => {
      const code = `
function identity<T>(arg: T): T {
  return arg
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0].name).toBe('identity')
    })

    it('should handle type annotations', () => {
      const code = `
const processUser = (user: { id: string; name: string }): string => {
  return user.name
}
`
      writeFileSync(TEST_FILE, code)

      const result = extractor.extractSymbols(TEST_FILE)

      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0].params).toContain('user')
    })
  })
})
