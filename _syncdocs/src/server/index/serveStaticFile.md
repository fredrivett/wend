---
title: serveStaticFile
generated: 2026-02-21T15:16:37.173Z
graphNode: src/server/index.ts:serveStaticFile
dependencies:
  - path: src/server/index.ts
    symbol: serveStaticFile
    hash: 8131a9f57e256532d6becf8708767698b20d05275c71283f82ec56dd42c8d0a8
---

# serveStaticFile

`function` in `src/server/index.ts:260-277`

Serve a static file with the appropriate Content-Type header.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| filePath | `string` | Yes | Absolute path to the file |
| res | `import('node:http').ServerResponse` | Yes | HTTP response object |

**Returns:** `boolean`
