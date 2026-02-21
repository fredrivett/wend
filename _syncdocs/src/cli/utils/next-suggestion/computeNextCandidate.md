---
title: computeNextCandidate
generated: 2026-02-21T15:16:37.167Z
graphNode: src/cli/utils/next-suggestion.ts:computeNextCandidate
dependencies:
  - path: src/cli/utils/next-suggestion.ts
    symbol: computeNextCandidate
    hash: 1ec36b21c2af43bb80b963b92d778b492c66658b1aa3a3ed5ebf6bbe894f59cd
---

# computeNextCandidate

`exported`

`function` in `src/cli/utils/next-suggestion.ts:14-48`

Compute the next file to document from pre-computed data.
Ranks by import count (most-imported first), then by undocumented symbol count.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| params | `{
  allSymbols: { file: string; symbol: { name: string } }[];
  documentedSymbols: Set<string>;
  sourceFiles: string[];
}` | Yes |  |

**Returns:** `NextCandidate | null`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `getRelativePath` | `src/cli/utils/next-suggestion.ts` | direct-call |
| `countImports` | `src/cli/utils/next-suggestion.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `registerStatusCommand` | `src/cli/commands/status.ts` | conditional-call |
| `showCoverageAndSuggestion` | `src/cli/utils/next-suggestion.ts` | conditional-call |
