/**
 * Custom Error classes for SyncDoc Backend.
 */

export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

export class LimitError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'LimitError';
    this.statusCode = 400;
    this.details = details.length > 0 ? details : [{ path: 'ast', message }];
  }
}

export class SanitizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SanitizationError';
    this.statusCode = 500;
  }
}

export default { ValidationError, LimitError, SanitizationError };
