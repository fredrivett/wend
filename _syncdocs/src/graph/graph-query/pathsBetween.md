---
title: pathsBetween
generated: 2026-02-21T15:16:37.171Z
graphNode: src/graph/graph-query.ts:pathsBetween
dependencies:
  - path: src/graph/graph-query.ts
    symbol: pathsBetween
    hash: 2c9e4851fcd783621577f10713c04bbe4a43ac2e7aa25792b5bd4af5253fc110
---

# pathsBetween

`exported`

`function` in `src/graph/graph-query.ts:51-90`

Find all paths between two nodes using DFS.
Returns an array of paths, where each path is an array of node IDs.
Limits to maxPaths to avoid combinatorial explosion.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| graph | `FlowGraph` | Yes |  |
| fromId | `string` | Yes |  |
| toId | `string` | Yes |  |
| maxPaths | `unknown` | No |  (default: `10`) |

**Returns:** `string[][]`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `buildAdjacencyList` | `src/graph/graph-query.ts` | direct-call |
| `dfs` | `src/graph/graph-query.ts` | direct-call |
