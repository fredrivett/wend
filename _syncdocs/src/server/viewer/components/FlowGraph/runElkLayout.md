---
title: runElkLayout
generated: 2026-02-21T15:16:37.175Z
graphNode: src/server/viewer/components/FlowGraph.tsx:runElkLayout
dependencies:
  - path: src/server/viewer/components/FlowGraph.tsx
    symbol: runElkLayout
    hash: 5cea563ee8eca55ceceee3185480d4206b523c95c6ee7845075ae91a094026e7
---

# runElkLayout

`function` in `src/server/viewer/components/FlowGraph.tsx:119-154`

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| currentNodes | `Node[]` | Yes |  |
| graphEdges | `FlowGraphData['edges']` | Yes |  |
| layoutOptions | `LayoutOptions` | Yes |  |
| sizeCache | `SizeCache` | No |  |

**Returns:** `Promise<Map<string, { x: number; y: number }>>`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `snapCeil` | `src/server/viewer/grid.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `FlowGraphInner` | `src/server/viewer/components/FlowGraph.tsx` | direct-call |

*This symbol is async.*
