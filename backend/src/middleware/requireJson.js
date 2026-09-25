/**
 * Require JSON Content-Type Middleware for SyncDoc Backend.
 * Enforces application/json Content-Type header on mutating requests (POST, PUT, PATCH).
 */

export function requireJson(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.toLowerCase().includes('application/json')) {
      return res.status(415).json({
        success: false,
        error: 'Unsupported Media Type',
        message: 'Content-Type header must be application/json',
      });
    }
  }
  next();
}

export default requireJson;
