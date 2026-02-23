/**
 * Types for staleness checker
 */

export interface DocDependency {
  path: string;
  symbol: string;
  hash: string;
  asOf?: string; // Git commit hash when this was last valid
}

export interface DocMetadata {
  title: string;
  syncdocsVersion?: string;
  generated: string;
  dependencies: DocDependency[];
  // Badge / symbol metadata
  kind?: string;
  exported?: boolean;
  isAsync?: boolean;
  hasJsDoc?: boolean;
  isTrivial?: boolean;
  deprecated?: string | boolean;
  filePath?: string;
  lineRange?: string;
  entryType?: string;
  httpMethod?: string;
  route?: string;
  eventTrigger?: string;
  taskId?: string;
}

export interface StaleDoc {
  docPath: string;
  reason: string;
  staleDependencies: StaleDependency[];
}

export interface StaleDependency {
  path: string;
  symbol: string;
  oldHash: string;
  newHash: string;
  reason: 'changed' | 'not-found' | 'file-not-found';
}

export interface CheckResult {
  totalDocs: number;
  staleDocs: StaleDoc[];
  upToDate: string[];
  errors: string[];
}
