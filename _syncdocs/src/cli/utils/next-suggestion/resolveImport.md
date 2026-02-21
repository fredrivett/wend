---
title: resolveImport
generated: 2026-02-21T15:16:37.168Z
graphNode: src/cli/utils/next-suggestion.ts:resolveImport
dependencies:
  - path: src/cli/utils/next-suggestion.ts
    symbol: resolveImport
    hash: e580e30aabf21c6c7eb6159341009f5bd1f36413a6541477000c2b5cbdba0fa7
---

# resolveImport

`function` in `src/cli/utils/next-suggestion.ts:402-432`

Resolve a relative import specifier to an absolute file path.

Tries the exact path, then common extensions (`.ts`, `.tsx`, `.js`, `.jsx`),
then `index.*` variants. Only resolves to files in the `sourceFiles` list.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| fromDir | `string` | Yes |  |
| specifier | `string` | Yes |  |
| sourceFiles | `string[]` | Yes |  |

**Returns:** `string | null`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `countImports` | `src/cli/utils/next-suggestion.ts` | direct-call |
