---
title: extractOverview
generated: 2026-02-21T15:16:37.173Z
graphNode: src/server/index.ts:extractOverview
dependencies:
  - path: src/server/index.ts
    symbol: extractOverview
    hash: 7bf53b227145eac2c7269cfa0ba017e68dd7dcc5e58d95adec9f786e6f1d0909
---

# extractOverview

`exported`

`function` in `src/server/index.ts:71-89`

Extract the overview text from a markdown doc file.

Strips frontmatter and the title heading, then returns everything up to
the first `<details>` block or `##` heading.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| content | `string` | Yes | Raw markdown content of the doc file |

**Returns:** `string`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `buildSymbolIndex` | `src/server/index.ts` | direct-call |
