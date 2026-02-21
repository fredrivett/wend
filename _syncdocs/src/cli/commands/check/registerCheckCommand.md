---
title: registerCheckCommand
generated: 2026-02-21T15:16:37.164Z
graphNode: src/cli/commands/check.ts:registerCheckCommand
dependencies:
  - path: src/cli/commands/check.ts
    symbol: registerCheckCommand
    hash: 02537eebcd3d17c8111f45f843ca596236ec94c27effc4f52c56042d78459f2b
---

# registerCheckCommand

`exported`

`function` in `src/cli/commands/check.ts:6-91`

Register the `syncdocs check` CLI command.

Scans all generated docs for staleness by comparing source code hashes
against the hashes stored in doc frontmatter. Exits with code 1 if any
stale docs are found (useful for CI).

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| cli | `CAC` | Yes |  |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `loadConfig` | `src/cli/utils/config.ts` | direct-call |
| `getRelativePath` | `src/cli/commands/check.ts` | conditional-call |
| `formatStaleReason` | `src/cli/commands/check.ts` | conditional-call |
