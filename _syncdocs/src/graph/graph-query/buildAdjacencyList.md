---
title: buildAdjacencyList
generated: 2026-02-21T15:16:37.172Z
graphNode: src/graph/graph-query.ts:buildAdjacencyList
dependencies:
  - path: src/graph/graph-query.ts
    symbol: buildAdjacencyList
    hash: 164e8dda9436f98408f40ebcd08213d67520ffadd1b5e0782c293e0639902282
---

# buildAdjacencyList

`function` in `src/graph/graph-query.ts:90-103`

Build an adjacency list from graph edges (source → [targets])

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| graph | `FlowGraph` | Yes |  |

**Returns:** `Map<string, string[]>`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `reachableFrom` | `src/graph/graph-query.ts` | direct-call |
| `pathsBetween` | `src/graph/graph-query.ts` | direct-call |
