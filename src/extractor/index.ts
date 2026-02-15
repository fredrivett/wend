/**
 * Symbol extraction - exports the main extractor
 */

export type { ExtractionResult, ImportInfo, SymbolInfo } from './types.js';
export { resolveImportPath } from './resolve-import.js';
export { TypeScriptExtractor } from './typescript-extractor.js';
