---
title: detectIncludePatterns
generated: 2026-02-21T15:16:37.166Z
graphNode: src/cli/utils/detect-sources.ts:detectIncludePatterns
dependencies:
  - path: src/cli/utils/detect-sources.ts
    symbol: detectIncludePatterns
    hash: 6be9d0ccd84e3b3823f1d404ab36306dfe55bb0f15280ce89a6d72df9a81e50f
---

# detectIncludePatterns

`exported`

`function` in `src/cli/utils/detect-sources.ts:18-51`

Detect likely source-code include patterns from common project layouts.

Returns candidate patterns in priority order. Falls back to the historical
default when no likely source files are found.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| rootDir | `string` | Yes |  |

**Returns:** `string[]`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `registerInitCommand` | `src/cli/commands/init.ts` | direct-call |
