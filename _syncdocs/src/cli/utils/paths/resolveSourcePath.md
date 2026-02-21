---
title: resolveSourcePath
generated: 2026-02-21T15:16:37.168Z
graphNode: src/cli/utils/paths.ts:resolveSourcePath
dependencies:
  - path: src/cli/utils/paths.ts
    symbol: resolveSourcePath
    hash: fdbb7f89d70caad703c655c0923d66c5da28eec8ea230836885ab57bf4a3dbfe
---

# resolveSourcePath

`exported`

`function` in `src/cli/utils/paths.ts:36-67`

Resolve a source file path from doc frontmatter to an absolute path
in the current working directory. Used when reading source files.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| filePath | `string` | Yes |  |
| cwd | `unknown` | No |  (default: `process.cwd()`) |

**Returns:** `string`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `StaleChecker` | `src/checker/index.ts` | direct-call |
