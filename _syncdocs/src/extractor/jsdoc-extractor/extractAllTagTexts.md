---
title: extractAllTagTexts
generated: 2026-02-21T15:16:37.169Z
graphNode: src/extractor/jsdoc-extractor.ts:extractAllTagTexts
dependencies:
  - path: src/extractor/jsdoc-extractor.ts
    symbol: extractAllTagTexts
    hash: e3cd203cba8e326a884cdfa980c7d222e850fc2c148c1a4dab7bc5c5517b6444
---

# extractAllTagTexts

`function` in `src/extractor/jsdoc-extractor.ts:188-208`

Extract all occurrences of a given tag name (e.g. 'throws').

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| jsDoc | `ts.JSDoc` | Yes |  |
| tagName | `string` | Yes |  |

**Returns:** `string[]`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `commentToString` | `src/extractor/jsdoc-extractor.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `extractJsDoc` | `src/extractor/jsdoc-extractor.ts` | direct-call |
