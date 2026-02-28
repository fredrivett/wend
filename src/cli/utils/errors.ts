/**
 * Custom error classes for piste CLI
 */

/** Base error class for all piste errors. */
export class PisteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PisteError';
  }
}

/** Thrown when the piste configuration file is invalid or missing required fields. */
export class ConfigError extends PisteError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Thrown when input validation fails (e.g. invalid file paths or symbol names). */
export class ValidationError extends PisteError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Thrown when symbol extraction from a source file fails. */
export class ExtractionError extends PisteError {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/** Thrown when documentation generation fails for a symbol. */
export class GenerationError extends PisteError {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationError';
  }
}
