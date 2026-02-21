---
title: extractFunctionId
generated: 2026-02-21T15:16:37.172Z
graphNode: src/matchers/inngest.ts:extractFunctionId
dependencies:
  - path: src/matchers/inngest.ts
    symbol: extractFunctionId
    hash: 050add51d7442e7ab809e7abc01ef59ab666a6ff5da6ef76ffc3a22ef593f1e4
---

# extractFunctionId

`function` in `src/matchers/inngest.ts:25-34`

Extract the function ID from an inngest.createFunction call.
Looks for patterns like: { id: "analyze-image" }

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| body | `string` | Yes |  |

**Returns:** `string | null`
