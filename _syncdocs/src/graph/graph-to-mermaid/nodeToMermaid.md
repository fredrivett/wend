---
title: nodeToMermaid
generated: 2026-02-21T15:16:37.172Z
graphNode: src/graph/graph-to-mermaid.ts:nodeToMermaid
dependencies:
  - path: src/graph/graph-to-mermaid.ts
    symbol: nodeToMermaid
    hash: 1baf4e2b8b3d4e508821398ea63dee7f025eb8d9c023c7d857d51793b9631ba6
---

# nodeToMermaid

`exported`

`function` in `src/graph/graph-to-mermaid.ts:7-46`

Generate a mermaid flowchart for a specific node and its immediate connections.
Used in per-symbol documentation.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| graph | `FlowGraph` | Yes |  |
| nodeId | `string` | Yes |  |
| depth | `unknown` | No |  (default: `1`) |

**Returns:** `string`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `buildMermaid` | `src/graph/graph-to-mermaid.ts` | direct-call |
