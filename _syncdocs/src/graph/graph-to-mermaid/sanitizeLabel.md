---
title: sanitizeLabel
generated: 2026-02-21T15:16:37.172Z
graphNode: src/graph/graph-to-mermaid.ts:sanitizeLabel
dependencies:
  - path: src/graph/graph-to-mermaid.ts
    symbol: sanitizeLabel
    hash: 4e32ef11830135e16d23b1f831de0348b99b4aafeaa4c9ac05d185fef8001cf6
---

# sanitizeLabel

`function` in `src/graph/graph-to-mermaid.ts:155-162`

Sanitize a label for mermaid (escape characters that break parsing)

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| label | `string` | Yes |  |

**Returns:** `string`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `buildMermaid` | `src/graph/graph-to-mermaid.ts` | conditional-call |
