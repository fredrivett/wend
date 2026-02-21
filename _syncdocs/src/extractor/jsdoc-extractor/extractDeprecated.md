---
title: extractDeprecated
generated: 2026-02-21T15:16:37.169Z
graphNode: src/extractor/jsdoc-extractor.ts:extractDeprecated
dependencies:
  - path: src/extractor/jsdoc-extractor.ts
    symbol: extractDeprecated
    hash: c3b2536eaa41242ca263ab724b86780b38c9e2fba87d2f902f730a503f986405
---

# extractDeprecated

> **Deprecated**: tag. Returns true if present with no reason,
or the reason string if provided.

`function` in `src/extractor/jsdoc-extractor.ts:131-152`

Extract

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| jsDoc | `ts.JSDoc` | Yes |  |

**Returns:** `string | true | undefined`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `commentToString` | `src/extractor/jsdoc-extractor.ts` | conditional-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `extractJsDoc` | `src/extractor/jsdoc-extractor.ts` | direct-call |
