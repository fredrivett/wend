---
title: showCoverageAndSuggestion
generated: 2026-02-21T15:16:37.168Z
graphNode: src/cli/utils/next-suggestion.ts:showCoverageAndSuggestion
dependencies:
  - path: src/cli/utils/next-suggestion.ts
    symbol: showCoverageAndSuggestion
    hash: e98d811607ad521391ebaac130f88b0451f16463d0b46a4587b774fffae47cb4
---

# showCoverageAndSuggestion

`exported`

`function` in `src/cli/utils/next-suggestion.ts:271-289`

Self-contained: scan the project, show coverage stats and next suggestion.
Use this from commands that don't already have scanning data (e.g. generate).

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| outputDir | `string` | Yes |  |
| scope | `SyncdocsConfig['scope']` | Yes |  |

**Returns:** `void`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `scanProject` | `src/cli/utils/next-suggestion.ts` | direct-call |
| `renderCoverageStats` | `src/cli/utils/next-suggestion.ts` | direct-call |
| `computeNextCandidate` | `src/cli/utils/next-suggestion.ts` | conditional-call |
| `renderNextSuggestion` | `src/cli/utils/next-suggestion.ts` | conditional-call |
