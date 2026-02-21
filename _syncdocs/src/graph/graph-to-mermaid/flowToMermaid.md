---
title: flowToMermaid
generated: 2026-02-21T15:16:37.172Z
graphNode: src/graph/graph-to-mermaid.ts:flowToMermaid
dependencies:
  - path: src/graph/graph-to-mermaid.ts
    symbol: flowToMermaid
    hash: 27c185cdf919955bbe81651b55d04bd9802afb03a3bd8b966fa616e281451d57
---

# flowToMermaid

`exported`

`function` in `src/graph/graph-to-mermaid.ts:46-60`

Generate a mermaid flowchart for an entire flow (from an entry point).
Shows all nodes reachable from the entry point.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| nodes | `GraphNode[]` | Yes |  |
| edges | `GraphEdge[]` | Yes |  |
| entryNodeId | `string` | No |  |

**Returns:** `string`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `buildMermaid` | `src/graph/graph-to-mermaid.ts` | direct-call |
