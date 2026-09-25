/**
 * Request ID Middleware for SyncDoc Backend.
 * Attaches a unique X-Request-Id header to all HTTP requests and responses.
 */

import { randomUUID } from 'crypto';

export function requestIdMiddleware(req, res, next) {
  const existingId = req.headers['x-request-id'];
  const requestId = typeof existingId === 'string' && existingId.trim() !== '' ? existingId : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

export default requestIdMiddleware;
