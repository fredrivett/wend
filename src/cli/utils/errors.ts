/**
 * Custom error classes for syncdocs CLI
 */

/** Base error class for all syncdocs errors. */
export class SyncDocsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncDocsError';
  }
}

/** Thrown when the syncdocs configuration file is invalid or missing required fields. */
export class ConfigError extends SyncDocsError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Thrown when input validation fails (e.g. invalid file paths or symbol names). */
export class ValidationError extends SyncDocsError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Thrown when symbol extraction from a source file fails. */
export class ExtractionError extends SyncDocsError {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/** Thrown when documentation generation fails for a symbol. */
export class GenerationError extends SyncDocsError {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationError';
  }
}
