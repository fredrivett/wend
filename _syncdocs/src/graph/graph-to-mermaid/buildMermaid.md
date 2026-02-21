---
title: buildMermaid
generated: 2026-02-21T15:16:37.172Z
graphNode: src/graph/graph-to-mermaid.ts:buildMermaid
dependencies:
  - path: src/graph/graph-to-mermaid.ts
    symbol: buildMermaid
    hash: 301f6918d0c3139da387bc45a167d3baa7569ce5b19a0cf2b63d8934abb9e080
---

# buildMermaid

`function` in `src/graph/graph-to-mermaid.ts:60-130`

Build a mermaid flowchart string from a set of nodes and edges.

Groups nodes into subgraphs by file path, applies styling to the
highlighted node and entry points, and renders edge arrows based on type.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| highlightId | `string` | Yes |  |
| includedIds | `Set<string>` | Yes |  |
| edges | `GraphEdge[]` | Yes |  |
| nodeMap | `Map<string, GraphNode>` | Yes |  |

**Returns:** `string`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `sanitizeId` | `src/graph/graph-to-mermaid.ts` | direct-call |
| `formatNodeLabel` | `src/graph/graph-to-mermaid.ts` | direct-call |
| `edgeArrow` | `src/graph/graph-to-mermaid.ts` | direct-call |
| `sanitizeLabel` | `src/graph/graph-to-mermaid.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `nodeToMermaid` | `src/graph/graph-to-mermaid.ts` | direct-call |
| `flowToMermaid` | `src/graph/graph-to-mermaid.ts` | direct-call |
