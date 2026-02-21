---
title: findSourceFiles
generated: 2026-02-21T15:16:37.168Z
graphNode: src/cli/utils/next-suggestion.ts:findSourceFiles
dependencies:
  - path: src/cli/utils/next-suggestion.ts
    symbol: findSourceFiles
    hash: a53de60c0a3087b5f14e6c23c98d8c634d2b393cf94eaa525222f0772c7d8e38
---

# findSourceFiles

`exported`

`function` in `src/cli/utils/next-suggestion.ts:297-334`

Find all source files matching the scope's include/exclude patterns.

Recursively walks the directory tree, applying picomatch patterns to filter
files. Skips `.git` and `node_modules` directories.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| rootDir | `string` | Yes | Root directory to search from |
| scope | `SyncdocsConfig['scope']` | Yes | Include and exclude glob patterns |

**Returns:** `string[]`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `walk` | `src/cli/utils/next-suggestion.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `registerSyncCommand` | `src/cli/commands/sync.ts` | direct-call |
| `scanProject` | `src/cli/utils/next-suggestion.ts` | direct-call |
