---
title: startServer
generated: 2026-02-21T15:16:37.174Z
graphNode: src/server/index.ts:startServer
dependencies:
  - path: src/server/index.ts
    symbol: startServer
    hash: 8bc7695d720b408a4036fcfec10bf950ba9fe4c78b452db36e693d6fc802868e
---

# startServer

`exported`

`function` in `src/server/index.ts:277-408`

Start the syncdocs documentation viewer HTTP server.

Serves the single-page viewer app, a JSON API for the symbol index and
individual doc pages, and the graph data. Watches the output directory
for changes and rebuilds the index automatically.

If the requested port is taken, retries up to 10 consecutive ports.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| outputDir | `string` | Yes | Path to the syncdocs output directory (e.g. `_syncdocs`) |
| port | `number` | Yes | Preferred port number to listen on |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `buildSymbolIndex` | `src/server/index.ts` | direct-call |
| `buildIndexResponse` | `src/server/index.ts` | conditional-call |
| `buildDocResponse` | `src/server/index.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `registerServeCommand` | `src/cli/commands/serve.ts` | direct-call |

*This symbol is async.*

**Throws:**

- If no available port is found after 10 attempts
