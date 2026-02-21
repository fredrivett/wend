---
title: commentToString
generated: 2026-02-21T15:16:37.169Z
graphNode: src/extractor/jsdoc-extractor.ts:commentToString
dependencies:
  - path: src/extractor/jsdoc-extractor.ts
    symbol: commentToString
    hash: a9a6c3db0e7cdff9213203968b427fe64bc53df390a28cb7b805b199b9cac622
---

# commentToString

`function` in `src/extractor/jsdoc-extractor.ts:7-21`

/**
 * Normalize a JSDoc comment value to a plain string.
 * The TS API returns either a string or a NodeArray<JSDocComment> depending on
 * whether the comment contains inline tags like {@link ...}.
 

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| comment | `string | ts.NodeArray<ts.JSDocComment> | undefined` | Yes |  |

**Returns:** `string | undefined`

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `extractJsDoc` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractParamDescriptions` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractReturns` | `src/extractor/jsdoc-extractor.ts` | conditional-call |
| `extractExamples` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractDeprecated` | `src/extractor/jsdoc-extractor.ts` | conditional-call |
| `extractSeeTags` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractAllTagTexts` | `src/extractor/jsdoc-extractor.ts` | direct-call |
