/**
 * Symbol extraction - exports the main extractor and utilities
 */

export { resolveImportPath } from './resolve-import/index.js';
export type { ExtractionResult, ImportInfo, SymbolInfo } from './types.js';
export { TypeScriptExtractor } from './typescript/index.js';
