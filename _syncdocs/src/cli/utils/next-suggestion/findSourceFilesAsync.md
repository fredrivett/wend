---
title: findSourceFilesAsync
generated: 2026-02-21T15:16:37.168Z
graphNode: src/cli/utils/next-suggestion.ts:findSourceFilesAsync
dependencies:
  - path: src/cli/utils/next-suggestion.ts
    symbol: findSourceFilesAsync
    hash: 0c23590120c25211a006807f22139b6836cceb9951d09fbcab3e0b67c1ae5b0b
---

# findSourceFilesAsync

`function` in `src/cli/utils/next-suggestion.ts:207-242`

/**
 * Async version of {@link findSourceFiles}that yields to the event loop
 * between I/O operations so spinner animations stay smooth.
 

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| rootDir | `string` | Yes |  |
| scope | `SyncdocsConfig['scope']` | Yes |  |

**Returns:** `Promise<string[]>`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `walk` | `src/cli/utils/next-suggestion.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `scanProjectAsync` | `src/cli/utils/next-suggestion.ts` | direct-call |

*This symbol is async.*
