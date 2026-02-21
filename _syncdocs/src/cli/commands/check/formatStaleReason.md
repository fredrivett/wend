---
title: formatStaleReason
generated: 2026-02-21T15:16:37.165Z
graphNode: src/cli/commands/check.ts:formatStaleReason
dependencies:
  - path: src/cli/commands/check.ts
    symbol: formatStaleReason
    hash: de3ce74b6259adc1023a1f334403eded5a090332760b94e9e21af96e05a3199a
---

# formatStaleReason

`function` in `src/cli/commands/check.ts:91-103`

Map a staleness reason code to a human-readable label.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| reason | `'changed' | 'not-found' | 'file-not-found'` | Yes |  |

**Returns:** `string`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `registerCheckCommand` | `src/cli/commands/check.ts` | conditional-call |
