---
title: generateDependencyGraph
generated: 2026-02-21T15:16:37.173Z
graphNode: src/server/index.ts:generateDependencyGraph
dependencies:
  - path: src/server/index.ts
    symbol: generateDependencyGraph
    hash: 1dd94ebbfcda22c827d87693ff30aea9a9b544d735f5605fe2057e9fd6d6cab3
---

# generateDependencyGraph

`exported`

`function` in `src/server/index.ts:130-167`

Generate a mermaid flowchart showing a symbol's related dependencies.

Creates a left-to-right flowchart with clickable nodes linking to each
related symbol's doc page. Returns null if no related symbols exist in the index.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| entry | `SymbolEntry` | Yes | The symbol entry to generate the graph for |
| index | `SymbolIndex` | Yes | The full symbol index for resolving related names |

**Returns:** `string | null`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `safeId` | `src/server/index.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `buildDocResponse` | `src/server/index.ts` | conditional-call |
