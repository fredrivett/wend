---
title: ContentHasher
generated: 2026-02-03T11:29:50.806Z
dependencies:
  - path: /Users/fredrivett/code/FR/syncdocs/src/hasher/index.ts
    symbol: ContentHasher
    hash: 6bf2acdd6eadbec3589bf9e03a1b6c71ab4e5a012b8b697514d242981278106f
---
# ContentHasher

A utility class for generating content-based hashes of code symbols. The hasher focuses on functional changes by excluding metadata like names and export keywords, allowing safe refactoring operations like renaming without triggering false positives in change detection systems.

## Methods

### `hashSymbol(symbol: SymbolInfo): string`

Generates a SHA256 hash of a symbol's functional content (parameters and body).

**Parameters:**
- `symbol: SymbolInfo` - The symbol to hash

**Returns:**
- `string` - A SHA256 hash in hexadecimal format

### `getHashableContent(symbol: SymbolInfo): string`

Extracts and normalizes the hashable content from a symbol.

**Parameters:**
- `symbol: SymbolInfo` - The symbol to process

**Returns:**
- `string` - Normalized content string containing parameters and body

### `hash(content: string): string`

Creates a SHA256 hash of the provided content.

**Parameters:**
- `content: string` - The content to hash

**Returns:**
- `string` - SHA256 hash in hexadecimal format

### `hasChanged(oldSymbol: SymbolInfo, newSymbol: SymbolInfo): boolean`

Compares two symbols to detect functional changes.

**Parameters:**
- `oldSymbol: SymbolInfo` - The original symbol
- `newSymbol: SymbolInfo` - The updated symbol

**Returns:**
- `boolean` - True if the symbols have different content hashes

### `shortHash(hash: string): string`

Truncates a hash to the first 8 characters for display purposes.

**Parameters:**
- `hash: string` - The full hash string

**Returns:**
- `string` - First 8 characters of the hash

<details>
<summary>Usage Examples</summary>

```typescript
import { ContentHasher } from './ContentHasher';

const hasher = new ContentHasher();

// Basic symbol hashing
const symbol = {
  name: 'calculateTotal',
  params: '(price: number, tax: number)',
  body: '{ return price + (price * tax); }'
};

const hash = hasher.hashSymbol(symbol);
console.log(hash); // "a1b2c3d4e5f6..."

// Renaming doesn't change the hash
const renamedSymbol = {
  name: 'computeTotal', // Changed name
  params: '(price: number, tax: number)',
  body: '{ return price + (price * tax); }'
};

console.log(hasher.hashSymbol(renamedSymbol) === hash); // true

// Functional changes do change the hash
const modifiedSymbol = {
  name: 'calculateTotal',
  params: '(price: number, tax: number)',
  body: '{ return price * (1 + tax); }' // Different logic
};

console.log(hasher.hasChanged(symbol, modifiedSymbol)); // true

// Getting short hash for display
const shortHash = hasher.shortHash(hash);
console.log(shortHash); // "a1b2c3d4"

// Whitespace normalization prevents false positives
const symbol1 = {
  name: 'func',
  params: '(x: number)',
  body: '{\n  return x * 2;\n}'
};

const symbol2 = {
  name: 'func',
  params: '(x: number)',
  body: '{    return x * 2;    }' // Different whitespace
};

console.log(hasher.hasChanged(symbol1, symbol2)); // false
```

</details>

<details>
<summary>Implementation Details</summary>

The `ContentHasher` uses a multi-step process to ensure reliable change detection:

1. **Content Extraction**: Combines `symbol.params` and `symbol.body`, deliberately excluding the symbol name and any export/visibility modifiers.

2. **Whitespace Normalization**: 
   - Converts Windows line endings (`\r\n`) to Unix (`\n`)
   - Replaces tabs with double spaces
   - Collapses multiple consecutive spaces into single spaces
   - Trims leading and trailing whitespace

3. **Hash Generation**: Uses Node.js built-in `crypto.createHash('sha256')` for consistent, collision-resistant hashing.

4. **Change Detection**: Performs hash comparison rather than string comparison for efficiency and consistency.

The normalization step is crucial for preventing formatting tools, different editors, or code style changes from triggering false positives in change detection systems.

</details>

<details>
<summary>Edge Cases</summary>

**Empty Content**: Symbols with empty parameters and body will produce consistent hashes, but consider validation at the caller level.

```typescript
const emptySymbol = { name: 'empty', params: '', body: '' };
// Will produce hash of empty string after normalization
```

**Unicode Content**: The hasher properly handles Unicode characters in symbol content, but be aware that different Unicode normalization forms could produce different hashes.

**Large Symbols**: No explicit size limits, but very large symbol bodies will impact performance. Consider implementing size limits at the application level if needed.

**Malformed SymbolInfo**: The class assumes `params` and `body` properties exist and are strings. Runtime validation may be needed depending on data sources.

**Hash Collisions**: While SHA256 collisions are extremely unlikely, consider the implications for your use case if working with millions of symbols.

</details>