---
title: renderNextSuggestion
generated: 2026-02-21T15:16:37.167Z
graphNode: src/cli/utils/next-suggestion.ts:renderNextSuggestion
dependencies:
  - path: src/cli/utils/next-suggestion.ts
    symbol: renderNextSuggestion
    hash: d88531e68169133c9addbe0cbdbaf544bcda61554cb625c0980a577d57b619e9
---

# renderNextSuggestion

`exported`

`function` in `src/cli/utils/next-suggestion.ts:48-62`

Render the "Next up" suggestion as a bordered note box.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| candidate | `NextCandidate` | Yes |  |

**Returns:** `void`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `registerStatusCommand` | `src/cli/commands/status.ts` | conditional-call |
| `showCoverageAndSuggestion` | `src/cli/utils/next-suggestion.ts` | conditional-call |
