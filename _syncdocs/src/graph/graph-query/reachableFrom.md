---
title: reachableFrom
generated: 2026-02-21T15:16:37.171Z
graphNode: src/graph/graph-query.ts:reachableFrom
dependencies:
  - path: src/graph/graph-query.ts
    symbol: reachableFrom
    hash: 3a92af06492c877bf35827ffa9820df09635d9910dbe004f70860d02be59bca8
---

# reachableFrom

`exported`

`function` in `src/graph/graph-query.ts:17-51`

Find all nodes reachable from a starting node via BFS.
Returns the subgraph (nodes + edges) reachable from the start.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| graph | `FlowGraph` | Yes |  |
| startNodeId | `string` | Yes |  |

**Returns:** `{ nodes: GraphNode[]; edges: GraphEdge[] }`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `buildAdjacencyList` | `src/graph/graph-query.ts` | direct-call |
