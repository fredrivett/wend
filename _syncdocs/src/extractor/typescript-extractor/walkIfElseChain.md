---
title: walkIfElseChain
generated: 2026-02-21T15:16:37.170Z
graphNode: src/extractor/typescript-extractor.ts:walkIfElseChain
dependencies:
  - path: src/extractor/typescript-extractor.ts
    symbol: walkIfElseChain
    hash: 97cfd27155368b252ed1df393e0a2b77bb52422b85b434272b004971f55e1006
---

# walkIfElseChain

`const` in `src/extractor/typescript-extractor.ts:113-144`

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| node | `ts.IfStatement` | Yes |  |
| conditions | `ConditionInfo[]` | Yes |  |
| branchGroup | `string` | Yes |  |
| isFirst | `unknown` | No |  (default: `true`) |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `countBranch` | `src/extractor/typescript-extractor.ts` | direct-call |
| `walk` | `src/extractor/typescript-extractor.ts` | direct-call |
| `walkIfElseChain` | `src/extractor/typescript-extractor.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `TypeScriptExtractor` | `src/extractor/typescript-extractor.ts` | conditional-call |
| `walkIfElseChain` | `src/extractor/typescript-extractor.ts` | conditional-call |
| `walk` | `src/extractor/typescript-extractor.ts` | conditional-call |
