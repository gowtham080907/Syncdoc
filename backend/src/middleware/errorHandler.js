import config from '../config/env.js';
import logger from '../utils/logger.js';
import { logSecurityEvent } from '../utils/securityLogger.js';

/**
 * Centralized error handler middleware.
 */
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logSecurityEvent({
      level: 'warn',
      event: 'security.validation_failed',
      req: _req,
      reason: 'Malformed JSON payload',
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      details: [{ path: 'body', message: 'Malformed JSON payload' }],
    });
  }

  if (err.type === 'entity.too.large' || err.status === 413) {
    logSecurityEvent({
      level: 'warn',
      event: 'security.limit_exceeded',
      req: _req,
      reason: 'Payload Too Large',
    });
    return res.status(413).json({
      success: false,
      error: 'Payload Too Large',
      message: 'Request body exceeds maximum size limit',
    });
  }

  if (err.name === 'LimitError' || err.name === 'ValidationError') {
    logSecurityEvent({
      level: 'warn',
      event: 'security.limit_exceeded',
      req: _req,
      reason: err.message,
    });
    return res.status(400).json({
      success: false,
      error: 'Invalid AST',
      details: err.details && err.details.length > 0 ? err.details : [{ path: 'ast', message: err.message }],
    });
  }

  const statusCode = err.statusCode || err.status || 500;

  if (err.name === 'SanitizationError') {
    logSecurityEvent({
      level: 'error',
      event: 'security.sanitizer_error',
      req: _req,
      reason: err.message || 'Sanitization failure',
    });
  }

  logger.error(`Error (${statusCode}): ${err.message}`);

  if (process.env.NODE_ENV === 'production' || config.nodeEnv === 'production') {
    return res.status(statusCode).json({
      success: false,
      error: 'Internal server error',
    });
  }

  const response = {
    success: false,
    error: {
      code: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR'),
      message: err.message || 'Internal Server Error',
    },
  };

  if (config.isDevelopment && err.stack) {
    response.error.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
