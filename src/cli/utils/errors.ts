/**
 * Custom error classes for treck CLI
 */

/** Base error class for all treck errors. */
export class TreckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TreckError';
  }
}

/** Thrown when the treck configuration file is invalid or missing required fields. */
export class ConfigError extends TreckError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Thrown when input validation fails (e.g. invalid file paths or symbol names). */
export class ValidationError extends TreckError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Thrown when symbol extraction from a source file fails. */
export class ExtractionError extends TreckError {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/** Thrown when documentation generation fails for a symbol. */
export class GenerationError extends TreckError {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationError';
  }
}
