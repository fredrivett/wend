---
title: resolveImportPath
generated: 2026-02-21T15:16:37.170Z
graphNode: src/extractor/resolve-import.ts:resolveImportPath
dependencies:
  - path: src/extractor/resolve-import.ts
    symbol: resolveImportPath
    hash: 95c337ac5f768754f967a9d44418a5b157740cbec1538cf0b346341ed4f4d712
---

# resolveImportPath

`exported`

`function` in `src/extractor/resolve-import.ts:156-190`

Resolve an import specifier to an absolute file path.

Handles:
- Relative imports (./foo, ../bar)
- tsconfig path aliases (@/lib/foo,

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| fromFile | `string` | Yes |  |
| importSource | `string` | Yes |  |

**Returns:** `string | null`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `tryResolveFile` | `src/extractor/resolve-import.ts` | conditional-call |
| `loadTsconfigPaths` | `src/extractor/resolve-import.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `GraphBuilder` | `src/graph/graph-builder.ts` | direct-call |
