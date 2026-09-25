/**
 * Security Headers Middleware for SyncDoc Backend.
 * Configures Helmet to attach HTTP security headers while preserving CORS compatibility.
 */

import helmet from 'helmet';

export const securityHeadersMiddleware = helmet({
  hidePoweredBy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

export default securityHeadersMiddleware;
