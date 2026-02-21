---
title: isAsyncSymbol
generated: 2026-02-21T15:16:37.171Z
graphNode: src/graph/graph-builder.ts:isAsyncSymbol
dependencies:
  - path: src/graph/graph-builder.ts
    symbol: isAsyncSymbol
    hash: d989130721fc97026d75d24a4ba79bbec0ac57770083470fb2e5041796a5be3b
---

# isAsyncSymbol

`function` in `src/graph/graph-builder.ts:45-56`

Check whether a symbol's fullText indicates it is async.
Matches `async function`, `async (`, `async =>`  etc.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| symbol | `SymbolInfo` | Yes |  |

**Returns:** `boolean`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `GraphBuilder` | `src/graph/graph-builder.ts` | direct-call |
