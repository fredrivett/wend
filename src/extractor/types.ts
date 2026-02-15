/**
 * Types for symbol extraction
 */

export interface SymbolInfo {
  name: string;
  kind: 'function' | 'class' | 'const' | 'method';
  filePath: string;
  params: string;
  body: string;
  fullText: string;
  startLine: number;
  endLine: number;
}

export interface CallSite {
  name: string;
  expression: string;
}

export interface ImportInfo {
  name: string;
  originalName: string; // original export name (differs from name when renamed: import { foo as bar })
  source: string;
  isDefault: boolean;
}

export interface ExtractionResult {
  symbols: SymbolInfo[];
  errors: string[];
}
