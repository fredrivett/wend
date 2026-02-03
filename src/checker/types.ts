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
  generated: string;
  dependencies: DocDependency[];
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
