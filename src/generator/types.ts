/**
 * Types for documentation generator
 */

import type { SymbolInfo } from '../extractor/types.js';

export interface GeneratorConfig {
  apiKey: string;
  model?: string;
  outputDir: string;
  projectName?: string;
  style?: 'technical' | 'beginner-friendly' | 'comprehensive';
}

export interface GenerateRequest {
  symbol: SymbolInfo;
  context?: {
    relatedSymbols?: SymbolInfo[];
    projectContext?: string;
  };
  customPrompt?: string;
}

export interface GeneratedDoc {
  filePath: string;
  title: string;
  content: string;
  dependencies: DocDependency[];
}

export interface DocDependency {
  path: string;
  symbol: string;
  hash: string;
  asOf?: string;
}

export interface GenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
}
