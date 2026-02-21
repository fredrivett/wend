---
title: getRelativePath
generated: 2026-02-21T15:16:37.171Z
graphNode: src/graph/graph-builder.ts:getRelativePath
dependencies:
  - path: src/graph/graph-builder.ts
    symbol: getRelativePath
    hash: ef3684ac4a08f858be418deb45afccd989f15b6ab2e7337c6721d57388da32dc
---

# getRelativePath

`function` in `src/graph/graph-builder.ts:16-24`

Compute a path relative to `process.cwd()`.
Keeps node IDs deterministic and human-readable.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| absolutePath | `string` | Yes |  |

**Returns:** `string`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `GraphBuilder` | `src/graph/graph-builder.ts` | direct-call |
