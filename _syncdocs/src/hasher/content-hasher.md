---
title: ContentHasher
generated: 2026-02-03T11:46:06.517Z
dependencies:
  - path: /Users/fredrivett/code/FR/syncdocs/src/hasher/index.ts
    symbol: ContentHasher
    hash: 6bf2acdd6eadbec3589bf9e03a1b6c71ab4e5a012b8b697514d242981278106f
---
# ContentHasher

A utility class for generating consistent content-based hashes of code symbols. It focuses on hashing the functional content (parameters and body) while excluding cosmetic elements like names and formatting to prevent unnecessary staleness detection.

<details>
<summary>Methods</summary>

## `hashSymbol(symbol: SymbolInfo): string`

Generates a SHA256 hash of the symbol's content, excluding the name to allow renaming without triggering staleness.

**Parameters:**
- `symbol: SymbolInfo` - The symbol object containing `params`, `body`, and other metadata

**Returns:** `string` - A SHA256 hex hash of the symbol's normalized content

## `getHashableContent(symbol: SymbolInfo): string`

Extracts and normalizes the content that should be included in the hash calculation.

**Parameters:**
- `symbol: SymbolInfo` - The symbol object to extract content from

**Returns:** `string` - Normalized string combining `params` and `body` with whitespace normalization applied

## `hash(content: string): string`

Computes a SHA256 hash of the provided content string.

**Parameters:**
- `content: string` - The content to hash

**Returns:** `string` - SHA256 hash in hexadecimal format

## `normalizeWhitespace(content: string): string` (private)

Normalizes whitespace in content to prevent formatting changes from affecting the hash.

**Parameters:**
- `content: string` - The content to normalize

**Returns:** `string` - Content with normalized whitespace

**Normalization rules:**
- Converts `\r\n` to `\n` (line ending normalization)
- Converts tabs to double spaces
- Collapses multiple consecutive spaces to single spaces
- Trims leading and trailing whitespace

## `hasChanged(oldSymbol: SymbolInfo, newSymbol: SymbolInfo): boolean`

Compares two symbols to determine if their functional content has changed.

**Parameters:**
- `oldSymbol: SymbolInfo` - The previous version of the symbol
- `newSymbol: SymbolInfo` - The current version of the symbol

**Returns:** `boolean` - `true` if content has changed, `false` otherwise

## `shortHash(hash: string): string`

Creates a shortened version of a hash for display purposes.

**Parameters:**
- `hash: string` - The full hash string

**Returns:** `string` - First 8 characters of the hash

</details>

<details>
<summary>Usage Examples</summary>

```typescript
import { ContentHasher } from './ContentHasher';

const hasher = new ContentHasher();

// Hash a symbol
const symbol: SymbolInfo = {
  name: 'calculateSum',
  params: '(a: number, b: number)',
  body: '{ return a + b; }'
};

const hash = hasher.hashSymbol(symbol);
console.log(hash); // "a1b2c3d4e5f6..."

// Get short hash for display
const shortHash = hasher.shortHash(hash);
console.log(shortHash); // "a1b2c3d4"

// Check if symbols have changed
const oldSymbol = { name: 'add', params: '(x, y)', body: '{ return x + y; }' };
const newSymbol = { name: 'sum', params: '(x, y)', body: '{ return x + y; }' }; // renamed

console.log(hasher.hasChanged(oldSymbol, newSymbol)); // false (only name changed)

const modifiedSymbol = { name: 'add', params: '(x, y, z)', body: '{ return x + y + z; }' };
console.log(hasher.hasChanged(oldSymbol, modifiedSymbol)); // true (params/body changed)
```

</details>

<details>
<summary>Implementation Details</summary>

The `ContentHasher` class uses SHA256 for cryptographic hashing to ensure consistent, collision-resistant hashes across different environments.

**Hash Content Strategy:**
- **Included:** `params` + `body` content
- **Excluded:** `name`, export keywords, visibility modifiers, formatting

**Whitespace Normalization:**
The class applies aggressive whitespace normalization to prevent cosmetic formatting changes from affecting hash values:
1. Line ending normalization (`\r\n` → `\n`)
2. Tab to space conversion (tab → double space)
3. Space collapse (multiple spaces → single space)
4. Whitespace trimming

**Comparison Logic:**
The `hasChanged()` method performs hash-based comparison rather than direct string comparison, making it efficient for large symbols and consistent across formatting variations.

</details>

<details>
<summary>Edge Cases</summary>

**Empty Content:**
- Empty `params` and `body` will produce a hash of an empty string after normalization
- `null` or `undefined` values in `SymbolInfo` properties may cause runtime errors

**Whitespace Sensitivity:**
- Different combinations of spaces, tabs, and line endings will normalize to the same hash
- Significant whitespace (like in string literals) will be normalized, potentially changing semantics

**Hash Collisions:**
- While SHA256 collisions are extremely rare, they are theoretically possible
- Consider the implications for your use case if hash uniqueness is critical

**Performance Considerations:**
- Hashing large symbol bodies may impact performance
- The `shortHash()` method is purely cosmetic and doesn't affect collision probability

</details>

<details>
<summary>Related</summary>

- `SymbolInfo` interface - The symbol data structure this class operates on
- Node.js `crypto.createHash()` - The underlying hashing implementation
- Symbol comparison and staleness detection systems
- Code analysis and change detection workflows

</details>