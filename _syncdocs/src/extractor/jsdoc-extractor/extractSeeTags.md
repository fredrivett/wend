---
title: extractSeeTags
generated: 2026-02-21T15:16:37.169Z
graphNode: src/extractor/jsdoc-extractor.ts:extractSeeTags
dependencies:
  - path: src/extractor/jsdoc-extractor.ts
    symbol: extractSeeTags
    hash: fe253836749e7bd1120093eba7b37312ea962a9297f6525a6a75cf7a9c636c60
---

# extractSeeTags

`function` in `src/extractor/jsdoc-extractor.ts:152-188`

Extract

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| jsDoc | `ts.JSDoc` | Yes |  |

**Returns:** `string[]`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `commentToString` | `src/extractor/jsdoc-extractor.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `extractJsDoc` | `src/extractor/jsdoc-extractor.ts` | direct-call |

**See also:**

- tags. TheTS compiler parses these as JSDocSeeTag with a
special `name` property containing the reference, so we need dedicated handling.
