---
title: loadConfig
generated: 2026-02-21T15:16:37.166Z
graphNode: src/cli/utils/config.ts:loadConfig
dependencies:
  - path: src/cli/utils/config.ts
    symbol: loadConfig
    hash: c87da552db5b78d15019bc3acfa6508273e5d6dc95d91e6726a4ef90808bf559
---

# loadConfig

`exported`

`function` in `src/cli/utils/config.ts:10-36`

Load the syncdocs configuration from `_syncdocs/config.yaml`.

Parses the YAML config file to extract the output directory and
include/exclude scope patterns. Returns null if no config file exists.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| cwd | `unknown` | No | Working directory to resolve the config path from (default: `process.cwd()`) |

**Returns:** `SyncdocsConfig | null`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `stripQuotes` | `src/cli/utils/config.ts` | conditional-call |
| `parseYamlList` | `src/cli/utils/config.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `registerCheckCommand` | `src/cli/commands/check.ts` | direct-call |
| `registerServeCommand` | `src/cli/commands/serve.ts` | direct-call |
| `registerStatusCommand` | `src/cli/commands/status.ts` | direct-call |
| `registerSyncCommand` | `src/cli/commands/sync.ts` | direct-call |
