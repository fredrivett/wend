---
title: buildDocResponse
generated: 2026-02-21T15:16:37.173Z
graphNode: src/server/index.ts:buildDocResponse
dependencies:
  - path: src/server/index.ts
    symbol: buildDocResponse
    hash: ac9f44c78993bf8d3d0e4d064e3e940b5a72d1df177383e9bd8999b9b1aa4300
---

# buildDocResponse

`function` in `src/server/index.ts:196-251`

Build the JSON response for the `/api/doc` endpoint.

Reads the markdown file, strips frontmatter, and enriches the response
with metadata from the symbol index (dependency graph, related symbols).
Falls back to a basic response if the index is stale.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| docPath | `string` | Yes | Relative path to the doc file within the output directory |
| index | `SymbolIndex` | Yes | The symbol index for metadata enrichment |
| outputDir | `string` | Yes | Path to the syncdocs output directory |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `generateDependencyGraph` | `src/server/index.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `startServer` | `src/server/index.ts` | conditional-call |
