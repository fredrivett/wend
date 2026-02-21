---
title: countImports
generated: 2026-02-21T15:16:37.168Z
graphNode: src/cli/utils/next-suggestion.ts:countImports
dependencies:
  - path: src/cli/utils/next-suggestion.ts
    symbol: countImports
    hash: 9bfd59a25e995860a0b8e1dcb7fb22aece46b0fc26a9c3e874e260e835a76282
---

# countImports

`exported`

`function` in `src/cli/utils/next-suggestion.ts:365-402`

Count how many times each source file is imported by other files.

Parses import/export statements from all source files, resolves relative
specifiers, and tallies import counts per file. Used to rank documentation
priority (most-imported files first).

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| sourceFiles | `string[]` | Yes | List of absolute source file paths |

**Returns:** `Map<string, number>`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `resolveImport` | `src/cli/utils/next-suggestion.ts` | direct-call |
| `getRelativePath` | `src/cli/utils/next-suggestion.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `computeNextCandidate` | `src/cli/utils/next-suggestion.ts` | direct-call |
