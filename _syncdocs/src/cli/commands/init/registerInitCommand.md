---
title: registerInitCommand
generated: 2026-02-21T15:16:37.165Z
graphNode: src/cli/commands/init.ts:registerInitCommand
dependencies:
  - path: src/cli/commands/init.ts
    symbol: registerInitCommand
    hash: 373b67d67725704eb10197c39b6c42110c3e02dbe8a2d8d00b8b2d26737ee9ab
---

# registerInitCommand

`exported`

`function` in `src/cli/commands/init.ts:16-122`

Register the `syncdocs init` CLI command.

Runs an interactive setup wizard that prompts for output directory,
include/exclude patterns, and writes a `config.yaml` file.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| cli | `CAC` | Yes |  |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `detectIncludePatterns` | `src/cli/utils/detect-sources.ts` | direct-call |
| `splitGlobPatterns` | `src/cli/commands/init.ts` | direct-call |
| `generateConfigYAML` | `src/cli/commands/init.ts` | direct-call |
