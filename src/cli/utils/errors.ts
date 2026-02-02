/**
 * Custom error classes for syncdocs CLI
 */

export class SyncDocsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncDocsError'
  }
}

export class ConfigError extends SyncDocsError {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export class ValidationError extends SyncDocsError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ExtractionError extends SyncDocsError {
  constructor(message: string) {
    super(message)
    this.name = 'ExtractionError'
  }
}

export class GenerationError extends SyncDocsError {
  constructor(message: string) {
    super(message)
    this.name = 'GenerationError'
  }
}
