---
title: docPathToUrl
generated: 2026-02-21T15:16:37.179Z
graphNode: src/server/viewer/docs-utils.ts:docPathToUrl
dependencies:
  - path: src/server/viewer/docs-utils.ts
    symbol: docPathToUrl
    hash: 851f77055f07497ac0536912fefc7760156a3b5bc97a55f4e6cacd729e7f0642
---

# docPathToUrl

`exported`

`function` in `src/server/viewer/docs-utils.ts:1-4`

Convert a docPath (e.g. "src/checker/index/StaleChecker.md") to a URL path

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| docPath | `string` | Yes |  |

**Returns:** `string`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `TreeDir` | `src/server/viewer/components/DocsTree.tsx` | conditional-call |
| `makeRelatedLinksClickable` | `src/server/viewer/components/DocsViewer.tsx` | conditional-call |
