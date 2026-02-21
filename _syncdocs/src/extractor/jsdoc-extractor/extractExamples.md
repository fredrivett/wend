---
title: extractExamples
generated: 2026-02-21T15:16:37.169Z
graphNode: src/extractor/jsdoc-extractor.ts:extractExamples
dependencies:
  - path: src/extractor/jsdoc-extractor.ts
    symbol: extractExamples
    hash: 6659b07369722ac55657e62c3113b4a46025bd27bfde397ef25cd7397d4c5cfa
---

# extractExamples

`function` in `src/extractor/jsdoc-extractor.ts:111-131`

Extract all

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

**Examples:**

```typescript
tag content as code strings.
```
