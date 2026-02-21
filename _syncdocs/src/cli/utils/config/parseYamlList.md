---
title: parseYamlList
generated: 2026-02-21T15:16:37.166Z
graphNode: src/cli/utils/config.ts:parseYamlList
dependencies:
  - path: src/cli/utils/config.ts
    symbol: parseYamlList
    hash: 2cdc4ac180558537f582054103aacd0fd3c67e00528496ba91816bdfe75925a5
---

# parseYamlList

`function` in `src/cli/utils/config.ts:36-64`

Parse a YAML list under a given key.
Finds `key:` on its own line, then collects subsequent `- value` lines.
Skips blank lines and comment lines within the list.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| content | `string` | Yes |  |
| key | `string` | Yes |  |

**Returns:** `string[]`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `stripQuotes` | `src/cli/utils/config.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `loadConfig` | `src/cli/utils/config.ts` | direct-call |
