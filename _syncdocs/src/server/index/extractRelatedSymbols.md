---
title: extractRelatedSymbols
generated: 2026-02-21T15:16:37.173Z
graphNode: src/server/index.ts:extractRelatedSymbols
dependencies:
  - path: src/server/index.ts
    symbol: extractRelatedSymbols
    hash: 0ff4d1b7e07e814f8fba71765f9881dae114b5a3a718a356e8d052ef1aae4542
---

# extractRelatedSymbols

`exported`

`function` in `src/server/index.ts:89-130`

Extract related symbol names from a doc file's Related section.

Looks for backtick-wrapped (`SymbolName`) and bold (**SymbolName**) references
inside `<details><summary>Related</summary>` blocks, deduplicating and
excluding the symbol's own name.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| content | `string` | Yes | Raw markdown content of the doc file |
| selfName | `string` | Yes | Name of the current symbol (excluded from results) |

**Returns:** `string[]`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `addSymbol` | `src/server/index.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `buildSymbolIndex` | `src/server/index.ts` | direct-call |
