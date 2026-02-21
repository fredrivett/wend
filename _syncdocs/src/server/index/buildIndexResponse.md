---
title: buildIndexResponse
generated: 2026-02-21T15:16:37.173Z
graphNode: src/server/index.ts:buildIndexResponse
dependencies:
  - path: src/server/index.ts
    symbol: buildIndexResponse
    hash: 0d6c2a43f13b1020445e9f183a9d42d6972a894c522f570cb30eae2557507a74
---

# buildIndexResponse

`function` in `src/server/index.ts:167-196`

Build the JSON response for the `/api/index` endpoint.

Groups symbol entries by source directory and sorts both directories
and entries alphabetically for the sidebar tree.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| index | `SymbolIndex` | Yes |  |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `startServer` | `src/server/index.ts` | conditional-call |
