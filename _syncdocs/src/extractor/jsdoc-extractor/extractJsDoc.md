---
title: extractJsDoc
generated: 2026-02-21T15:16:37.169Z
graphNode: src/extractor/jsdoc-extractor.ts:extractJsDoc
dependencies:
  - path: src/extractor/jsdoc-extractor.ts
    symbol: extractJsDoc
    hash: 13aa0b9f13379c7623be727f38ba2b4dc7af561dcf9bfe9a8c3ba9c1729aafb3
---

# extractJsDoc

`exported`

`function` in `src/extractor/jsdoc-extractor.ts:21-71`

Extract JSDoc information from a TypeScript AST node.
Returns undefined if no JSDoc comment is found.

For VariableDeclarations (arrow functions, const assignments), the JSDoc is
attached to the parent VariableStatement, so we walk up the tree.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| node | `ts.Node` | Yes |  |
| _sourceFile | `ts.SourceFile` | Yes |  |

**Returns:** `JsDocInfo | undefined`

**Calls:**

| Symbol | File | Type |
|---|---|---|
| `commentToString` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractParamDescriptions` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractReturns` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractExamples` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractDeprecated` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractAllTagTexts` | `src/extractor/jsdoc-extractor.ts` | direct-call |
| `extractSeeTags` | `src/extractor/jsdoc-extractor.ts` | direct-call |

**Called by:**

| Symbol | File | Type |
|---|---|---|
| `TypeScriptExtractor` | `src/extractor/typescript-extractor.ts` | direct-call |
