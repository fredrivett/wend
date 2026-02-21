---
title: dfs
generated: 2026-02-21T15:16:37.171Z
graphNode: src/graph/graph-query.ts:dfs
dependencies:
  - path: src/graph/graph-query.ts
    symbol: dfs
    hash: 4e71d0b5d79ba02f1c8ae0f90c7187197ca371a52d77f732e490db35ec51f179
---

# dfs

`function` in `src/graph/graph-query.ts:65-85`

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| current | `string` | Yes |  |
| path | `string[]` | Yes |  |
| visited | `Set<string>` | Yes |  |

**Returns:** `void`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `dfs` | `src/graph/graph-query.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `pathsBetween` | `src/graph/graph-query.ts` | direct-call |
| `dfs` | `src/graph/graph-query.ts` | conditional-call |
