---
title: urlToDocPath
generated: 2026-02-21T15:16:37.180Z
graphNode: src/server/viewer/docs-utils.ts:urlToDocPath
dependencies:
  - path: src/server/viewer/docs-utils.ts
    symbol: urlToDocPath
    hash: 860aee449ec78b14697efd263ab0bec27bd992b737975daf2014b2baa11bcf28
---

# urlToDocPath

`exported`

`function` in `src/server/viewer/docs-utils.ts:4-11`

Convert a URL pathname back to a docPath for the API

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| pathname | `string` | Yes |  |

**Returns:** `string | null`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `DocsTree` | `src/server/viewer/components/DocsTree.tsx` | direct-call |
| `DocsViewer` | `src/server/viewer/components/DocsViewer.tsx` | direct-call |
