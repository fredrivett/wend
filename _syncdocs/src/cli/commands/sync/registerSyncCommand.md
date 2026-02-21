---
title: registerSyncCommand
generated: 2026-02-21T15:16:37.165Z
graphNode: src/cli/commands/sync.ts:registerSyncCommand
dependencies:
  - path: src/cli/commands/sync.ts
    symbol: registerSyncCommand
    hash: 84646837b7c609306428fc819c8e64578952b34fec901a9645a2e5ee2b13c916
---

# registerSyncCommand

`exported`

`function` in `src/cli/commands/sync.ts:9-141`

Register the `syncdocs sync` CLI command.

Finds source files, builds the dependency graph, and generates static
markdown documentation for every node. Optionally filters to a target path.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| cli | `CAC` | Yes |  |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `loadConfig` | `src/cli/utils/config.ts` | direct-call |
| `findSourceFiles` | `src/cli/utils/next-suggestion.ts` | direct-call |
| `entryPoints` | `src/graph/graph-query.ts` | direct-call |
