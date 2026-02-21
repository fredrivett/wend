---
title: escapeHtml
generated: 2026-02-21T15:16:37.180Z
graphNode: src/server/viewer/docs-utils.ts:escapeHtml
dependencies:
  - path: src/server/viewer/docs-utils.ts
    symbol: escapeHtml
    hash: 2bf0c9501f8785a8af4b0301202426c28164beeb03a0122d8e1a380b463b14f9
---

# escapeHtml

`exported`

`function` in `src/server/viewer/docs-utils.ts:11-20`

Escape HTML special characters to prevent XSS in rendered content.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| str | `string` | Yes |  |

**Returns:** `string`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `DocsViewer` | `src/server/viewer/components/DocsViewer.tsx` | direct-call |
