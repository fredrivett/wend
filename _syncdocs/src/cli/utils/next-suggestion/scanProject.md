---
title: scanProject
generated: 2026-02-21T15:16:37.167Z
graphNode: src/cli/utils/next-suggestion.ts:scanProject
dependencies:
  - path: src/cli/utils/next-suggestion.ts
    symbol: scanProject
    hash: bf327d3a04fa4426af782651ebac21f0325583f58447c24059cfedb240ddc864
---

# scanProject

`exported`

`function` in `src/cli/utils/next-suggestion.ts:72-130`

Scan the project and return coverage data.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| outputDir | `string` | Yes |  |
| scope | `SyncdocsConfig['scope']` | Yes |  |

**Returns:** `ProjectScan`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `findSourceFiles` | `src/cli/utils/next-suggestion.ts` | direct-call |
| `findMarkdownFiles` | `src/cli/utils/next-suggestion.ts` | conditional-call |
| `getRelativePath` | `src/cli/utils/next-suggestion.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `showCoverageAndSuggestion` | `src/cli/utils/next-suggestion.ts` | direct-call |
