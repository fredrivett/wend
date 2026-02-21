---
title: makeRelatedLinksClickable
generated: 2026-02-21T15:16:37.175Z
graphNode: src/server/viewer/components/DocsViewer.tsx:makeRelatedLinksClickable
dependencies:
  - path: src/server/viewer/components/DocsViewer.tsx
    symbol: makeRelatedLinksClickable
    hash: 6d65bcb50b2e5e2326ffa0f0cb3a3521b6872bd663b5e48ae6af59de2609d723
---

# makeRelatedLinksClickable

`function` in `src/server/viewer/components/DocsViewer.tsx:50-78`

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| container | `HTMLElement` | Yes |  |
| related | `DocData['related']` | Yes |  |
| navigate | `(path: string) => void` | Yes |  |

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `docPathToUrl` | `src/server/viewer/docs-utils.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `DocsViewer` | `src/server/viewer/components/DocsViewer.tsx` | direct-call |
