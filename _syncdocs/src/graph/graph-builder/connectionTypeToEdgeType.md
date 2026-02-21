---
title: connectionTypeToEdgeType
generated: 2026-02-21T15:16:37.171Z
graphNode: src/graph/graph-builder.ts:connectionTypeToEdgeType
dependencies:
  - path: src/graph/graph-builder.ts
    symbol: connectionTypeToEdgeType
    hash: 25ef796a287ec718c3c81230f9b5dee5aa33b12d716874d86b143a5b47161cea
---

# connectionTypeToEdgeType

`function` in `src/graph/graph-builder.ts:24-45`

Map a RuntimeConnection type string to a GraphEdge EdgeType.
Falls back to 'async-dispatch' for unknown connection types.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| type | `string` | Yes |  |

**Returns:** `EdgeType`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `GraphBuilder` | `src/graph/graph-builder.ts` | conditional-call |
