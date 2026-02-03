---
title: ContentHasher
generated: 2026-02-03T11:40:50.589Z
dependencies:
  - path: /Users/fredrivett/code/FR/syncdocs/src/hasher/index.ts
    symbol: ContentHasher
    hash: 6bf2acdd6eadbec3589bf9e03a1b6c71ab4e5a012b8b697514d242981278106f
---
# ContentHasher

A utility class for generating content-based hashes of code symbols while ignoring cosmetic changes like names, formatting, and whitespace. Designed to detect meaningful changes in symbol content (parameters and body) without triggering false positives from refactoring operations.

<details>
<summary>Methods</summary>

## hashSymbol(symbol: SymbolInfo): string

Generates a SHA256 hash of a symbol's meaningful content (parameters and body), excluding the symbol name to allow renames without triggering staleness detection.

**Parameters:**
- `symbol: SymbolInfo` - The symbol object containing params, body, and other metadata

**Returns:** A hex-encoded SHA256 hash string

## getHashableContent(symbol: SymbolInfo): string

Extracts and normalizes the content that should be included in the hash calculation. Combines the symbol's parameters and body while excluding name, export keywords, and visibility modifiers.

**Parameters:**
- `symbol: SymbolInfo` - The symbol object to extract content from

**Returns:** Normalized string containing parameters and body content

## hash(content: string): string

Computes a SHA256 hash of the provided string content.

**Parameters:**
- `content: string` - The string content to hash

**Returns:** Hex-encoded SHA256 hash

## normalizeWhitespace(content: string): string (private)

Normalizes whitespace in content to prevent formatting changes from affecting hash values. Handles line endings, tabs, multiple spaces, and trailing whitespace.

**Parameters:**
- `content: string` - Raw content string to normalize

**Returns:** Normalized content with consistent whitespace

## hasChanged(oldSymbol: SymbolInfo, newSymbol: SymbolInfo): boolean

Compares two symbol versions to determine if the meaningful content has changed by comparing their hashes.

**Parameters:**
- `oldSymbol: SymbolInfo` - Previous version of the symbol
- `newSymbol: SymbolInfo` - Current version of the symbol

**Returns:** `true` if content has changed, `false` otherwise

## shortHash(hash: string): string

Creates a shortened version of a hash for display purposes, taking only the first 8 characters.

**Parameters:**
- `hash: string` - Full hash string

**Returns:** Truncated hash (first 8 characters)

</details>

<details>
<summary>Usage Examples</summary>

```typescript
import { ContentHasher } from './content-hasher';

const hasher = new ContentHasher();

// Hash a symbol's content
const symbol = {
  name: 'myFunction',
  params: '(x: number, y: string)',
  body: '{ return x + y.length; }'
};

const hash = hasher.hashSymbol(symbol);
console.log(hash); // "a1b2c3d4e5f6..."

// Check if content changed between versions
const oldSymbol = { params: '(x: number)', body: '{ return x; }' };
const newSymbol = { params: '(x: number)', body: '{ return x * 2; }' };

if (hasher.hasChanged(oldSymbol, newSymbol)) {
  console.log('Symbol content has changed');
}

// Get display-friendly short hash
const shortVersion = hasher.shortHash(hash);
console.log(shortVersion); // "a1b2c3d4"

// Whitespace normalization doesn't affect hash
const symbol1 = { params: '(x:number)', body: '{return x;}' };
const symbol2 = { params: '( x : number )', body: '{\n  return x;\n}' };
const hash1 = hasher.hashSymbol(symbol1);
const hash2 = hasher.hashSymbol(symbol2);
console.log(hash1 === hash2); // true
```

</details>

<details>
<summary>Implementation Details</summary>

The class uses SHA256 hashing to ensure collision resistance and consistent hash generation. The normalization process includes:

- **Line ending normalization**: Converts `\r\n` to `\n` for cross-platform consistency
- **Tab conversion**: Replaces tabs with double spaces
- **Space consolidation**: Collapses multiple consecutive spaces into single spaces
- **Trimming**: Removes leading and trailing whitespace

Content selection is strategic - only `params` and `body` fields are included in the hash, allowing the following changes without triggering staleness:
- Symbol renames
- Export keyword changes
- Visibility modifier changes
- Comment modifications
- Import statement reordering

The SHA256 algorithm provides a 256-bit hash, represented as a 64-character hexadecimal string.

</details>

<details>
<summary>Edge Cases</summary>

- **Empty content**: If both params and body are empty strings, the hash will be computed on an empty string
- **Null/undefined fields**: The concatenation will include "undefined" or "null" as literal strings if symbol properties are missing
- **Unicode content**: SHA256 handles UTF-8 encoding, so Unicode characters in symbol content are supported
- **Very large symbols**: No size limits imposed by the hasher, but memory usage scales with symbol size
- **Hash collisions**: While theoretically possible with SHA256, practically negligible for code symbol content

**Potential gotchas:**
- Semantic equivalence is not detected (e.g., `x + 1` vs `1 + x`)
- Whitespace inside strings is normalized, which may not be desired for string literals
- Parameter order changes will trigger staleness detection

</details>

<details>
<summary>Related</summary>

- **SymbolInfo**: The interface/type expected as input to the hasher methods
- **Staleness detection systems**: Primary use case for this hasher
- **Content-based caching**: General pattern this class implements
- **Crypto module**: Node.js built-in used for SHA256 hashing (`createHash`)
- **Code analysis tools**: Often need similar content comparison capabilities

</details>