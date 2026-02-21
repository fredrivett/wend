---
title: buildSymbolIndex
generated: 2026-02-21T15:16:37.173Z
graphNode: src/server/index.ts:buildSymbolIndex
dependencies:
  - path: src/server/index.ts
    symbol: buildSymbolIndex
    hash: 65d7a1015d99286b6a20b67bf43e1e46f197b43a3808dae3dff4f3db6dc10904
---

# buildSymbolIndex

`function` in `src/server/index.ts:22-71`

Build a lookup index of all documented symbols from the output directory.

Parses every markdown doc file, extracts frontmatter metadata, and builds
two maps: one keyed by doc path, one keyed by symbol name (for cross-referencing).

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| outputDir | `string` | Yes | Path to the syncdocs output directory |

**Returns:** `SymbolIndex`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `findMarkdownFiles` | `src/cli/utils/next-suggestion.ts` | direct-call |
| `extractOverview` | `src/server/index.ts` | direct-call |
| `extractRelatedSymbols` | `src/server/index.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `startServer` | `src/server/index.ts` | direct-call |
