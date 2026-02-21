---
title: extractEventTrigger
generated: 2026-02-21T15:16:37.172Z
graphNode: src/matchers/inngest.ts:extractEventTrigger
dependencies:
  - path: src/matchers/inngest.ts
    symbol: extractEventTrigger
    hash: 1b4c5335c79892998114e91d40be838cf97ec0de8eed02b06eb91904968b0275
---

# extractEventTrigger

`function` in `src/matchers/inngest.ts:15-25`

Extract the event name from an inngest.createFunction call.
Looks for patterns like: { event: "user/created" } or { event: "app/image.analyzed" }

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| body | `string` | Yes |  |

**Returns:** `string | null`
