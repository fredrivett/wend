---
title: loadTsconfigPaths
generated: 2026-02-21T15:16:37.169Z
graphNode: src/extractor/resolve-import.ts:loadTsconfigPaths
dependencies:
  - path: src/extractor/resolve-import.ts
    symbol: loadTsconfigPaths
    hash: b87a1233c055f685e0d3b73265133406c54dd3f3b0272e5654e17c688ffeb707
---

# loadTsconfigPaths

`exported`

`function` in `src/extractor/resolve-import.ts:53-112`

Find and parse tsconfig.json paths from a source file's directory.
Walks up the directory tree until it finds a tsconfig.json.
Results are cached per tsconfig.json location.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| fromFile | `string` | Yes |  |

**Returns:** `TsconfigPaths | null`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `stripJsonComments` | `src/extractor/resolve-import.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `resolveImportPath` | `src/extractor/resolve-import.ts` | direct-call |
