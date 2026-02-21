---
title: stripJsonComments
generated: 2026-02-21T15:16:37.169Z
graphNode: src/extractor/resolve-import.ts:stripJsonComments
dependencies:
  - path: src/extractor/resolve-import.ts
    symbol: stripJsonComments
    hash: 20aaea28e792e72fd11da207fac8c6888d934b9271a2ea3914febbb66d5eb0fd
---

# stripJsonComments

`function` in `src/extractor/resolve-import.ts:6-45`

Strip // and /* comments from JSON text without corrupting string literals.
Walks character-by-character, skipping over quoted strings so that
sequences like "@/*" inside paths are preserved.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| text | `string` | Yes |  |

**Returns:** `string`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `loadTsconfigPaths` | `src/extractor/resolve-import.ts` | conditional-call |
