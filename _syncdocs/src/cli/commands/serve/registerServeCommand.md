---
title: registerServeCommand
generated: 2026-02-21T15:16:37.165Z
graphNode: src/cli/commands/serve.ts:registerServeCommand
dependencies:
  - path: src/cli/commands/serve.ts
    symbol: registerServeCommand
    hash: ba30ecc1878b4e3d1ac4da23d4bd9d4d5ef7d435a28b8d280981210fde5727ed
---

# registerServeCommand

`exported`

`function` in `src/cli/commands/serve.ts:10-64`

Register the `syncdocs serve` CLI command.

Starts the documentation viewer HTTP server and optionally opens it
in the default browser.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| cli | `CAC` | Yes |  |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `loadConfig` | `src/cli/utils/config.ts` | direct-call |
| `startServer` | `src/server/index.ts` | direct-call |
