---
title: walk
generated: 2026-02-21T15:16:37.170Z
graphNode: src/extractor/typescript-extractor.ts:walk
dependencies:
  - path: src/extractor/typescript-extractor.ts
    symbol: walk
    hash: d1d9f1b05417760c37dbf11fe7fc86312e469b67559ee4f4a07353d799a077b5
---

# walk

`const` in `src/extractor/typescript-extractor.ts:146-238`

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| node | `ts.Node` | Yes |  |
| conditions | `ConditionInfo[]` | Yes |  |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `getLine` | `src/extractor/typescript-extractor.ts` | conditional-call |
| `walkIfElseChain` | `src/extractor/typescript-extractor.ts` | conditional-call |
| `countBranch` | `src/extractor/typescript-extractor.ts` | conditional-call |
| `walk` | `src/extractor/typescript-extractor.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `TypeScriptExtractor` | `src/extractor/typescript-extractor.ts` | direct-call |
| `walkIfElseChain` | `src/extractor/typescript-extractor.ts` | direct-call |
| `walk` | `src/extractor/typescript-extractor.ts` | direct-call |
