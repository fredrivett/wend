/**
 * Custom error classes for wend CLI
 */

/** Base error class for all wend errors. */
export class WendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WendError';
  }
}

/** Thrown when the wend configuration file is invalid or missing required fields. */
export class ConfigError extends WendError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Thrown when input validation fails (e.g. invalid file paths or symbol names). */
export class ValidationError extends WendError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Thrown when symbol extraction from a source file fails. */
export class ExtractionError extends WendError {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/** Thrown when documentation generation fails for a symbol. */
export class GenerationError extends WendError {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationError';
  }
}
