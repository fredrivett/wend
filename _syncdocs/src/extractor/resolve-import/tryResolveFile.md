---
title: tryResolveFile
generated: 2026-02-21T15:16:37.170Z
graphNode: src/extractor/resolve-import.ts:tryResolveFile
dependencies:
  - path: src/extractor/resolve-import.ts
    symbol: tryResolveFile
    hash: cc3f1fa9edfb149eba076c8c740fdaf0b677634d75809dacc41e41f643a247a2
---

# tryResolveFile

`function` in `src/extractor/resolve-import.ts:122-156`

Try to resolve a file path by testing common extensions.
Handles .js → .ts extension swapping for TypeScript ESM projects.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| basePath | `string` | Yes |  |

**Returns:** `string | null`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `resolveImportPath` | `src/extractor/resolve-import.ts` | conditional-call |
