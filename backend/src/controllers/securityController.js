/**
 * Security Controller for SyncDoc Backend.
 * Handles dev/testing endpoint POST /api/security/sanitize.
 */

import { sanitizeHTML } from '../services/sanitizer.js';
import { MAX_HTML_LENGTH } from '../config/securityLimits.js';
import { logSecurityEvent } from '../utils/securityLogger.js';

export function sanitizeEndpoint(req, res, next) {
  try {
    const { html } = req.body || {};

    if (html === undefined || typeof html !== 'string') {
      logSecurityEvent({
        level: 'warn',
        event: 'security.validation_failed',
        req,
        reason: 'html property must be a string',
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: [
          {
            path: 'html',
            message: 'html property must be a non-null string',
          },
        ],
      });
    }

    if (html.length > MAX_HTML_LENGTH) {
      logSecurityEvent({
        level: 'warn',
        event: 'security.limit_exceeded',
        req,
        reason: `HTML length exceeds ${MAX_HTML_LENGTH}`,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: [
          {
            path: 'html',
            message: `HTML string length exceeds maximum allowed limit of ${MAX_HTML_LENGTH}`,
          },
        ],
      });
    }

    const sanitized = sanitizeHTML(html);
    return res.status(200).json({
      success: true,
      sanitized,
    });
  } catch (err) {
    return next(err);
  }
}

export default { sanitizeEndpoint };
