---
title: splitGlobPatterns
generated: 2026-02-21T15:16:37.165Z
graphNode: src/cli/commands/init.ts:splitGlobPatterns
dependencies:
  - path: src/cli/commands/init.ts
    symbol: splitGlobPatterns
    hash: ecfa4b35bed5ca4d3b1e0ac582db3e909516ab9fc153b3a336158b5b5474d827
---

# splitGlobPatterns

`function` in `src/cli/commands/init.ts:122-158`

Split a comma-separated glob list while preserving commas inside brace sets.
Example: `<pattern-1>,<pattern-2>` => two patterns.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| input | `string` | Yes |  |

**Returns:** `string[]`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `registerInitCommand` | `src/cli/commands/init.ts` | direct-call |
