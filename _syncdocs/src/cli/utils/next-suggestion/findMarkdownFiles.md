---
title: findMarkdownFiles
generated: 2026-02-21T15:16:37.168Z
graphNode: src/cli/utils/next-suggestion.ts:findMarkdownFiles
dependencies:
  - path: src/cli/utils/next-suggestion.ts
    symbol: findMarkdownFiles
    hash: bdf5332ee0c19f8df964c394aa26beb8e4e37fedf79444808ba6b9376654d17f
---

# findMarkdownFiles

`exported`

`function` in `src/cli/utils/next-suggestion.ts:334-365`

Recursively find all `.md` files in a directory.

Skips `node_modules` and `.git` directories. Returns an empty array
if the directory doesn't exist or can't be read.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| dir | `string` | Yes |  |

**Returns:** `string[]`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `findMarkdownFiles` | `src/cli/utils/next-suggestion.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `scanProject` | `src/cli/utils/next-suggestion.ts` | conditional-call |
| `scanProjectAsync` | `src/cli/utils/next-suggestion.ts` | conditional-call |
| `findMarkdownFiles` | `src/cli/utils/next-suggestion.ts` | conditional-call |
| `buildSymbolIndex` | `src/server/index.ts` | direct-call |
