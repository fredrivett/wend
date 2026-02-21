---
title: extractTaskId
generated: 2026-02-21T15:16:37.173Z
graphNode: src/matchers/trigger-dev.ts:extractTaskId
dependencies:
  - path: src/matchers/trigger-dev.ts
    symbol: extractTaskId
    hash: 050add51d7442e7ab809e7abc01ef59ab666a6ff5da6ef76ffc3a22ef593f1e4
---

# extractTaskId

`function` in `src/matchers/trigger-dev.ts:16-25`

Extract the task ID from a task() definition.
Looks for: task({ id: "process-image", ... })

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| body | `string` | Yes |  |

**Returns:** `string | null`
