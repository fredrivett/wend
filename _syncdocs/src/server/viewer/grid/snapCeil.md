---
title: snapCeil
generated: 2026-02-21T15:16:37.180Z
graphNode: src/server/viewer/grid.ts:snapCeil
dependencies:
  - path: src/server/viewer/grid.ts
    symbol: snapCeil
    hash: 33db6a2c18fe7143af289f05721522dee348e7a6dcff7ef2c3eb46c94e6a6ce6
---

# snapCeil

`exported`

`function` in `src/server/viewer/grid.ts:3-8`

Round a value up to the nearest multiple of SNAP_CEIL_SIZE (GRID_SIZE * 2).

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| value | `number` | Yes |  |

**Returns:** `number`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `runElkLayout` | `src/server/viewer/components/FlowGraph.tsx` | direct-call |
| `FlowGraphInner` | `src/server/viewer/components/FlowGraph.tsx` | conditional-call |
