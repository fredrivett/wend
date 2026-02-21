---
title: toRelativePath
generated: 2026-02-21T15:16:37.168Z
graphNode: src/cli/utils/paths.ts:toRelativePath
dependencies:
  - path: src/cli/utils/paths.ts
    symbol: toRelativePath
    hash: 785789f67ee52181b4612bfe6a65d578e5979bbcafa4f2dfabd5ad7cdad89fa0
---

# toRelativePath

`exported`

`function` in `src/cli/utils/paths.ts:10-36`

Convert an absolute or foreign-worktree file path to a relative path.
Used when writing dependency paths into doc frontmatter.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| filePath | `string` | Yes |  |
| cwd | `unknown` | No |  (default: `process.cwd()`) |

**Returns:** `string`
