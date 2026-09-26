/**
 * Security Event Logger for SyncDoc Backend.
 * Outputs single-line JSON logs for security events without logging sensitive contents.
 */

export function logSecurityEvent({
  level = 'info',
  event,
  req = null,
  requestId = null,
  method = null,
  path = null,
  reason = null,
  counts = null,
}) {
  const finalRequestId = req ? (req.requestId || req.headers?.['x-request-id'] || null) : requestId;
  const finalMethod = req ? req.method : method;
  let finalPath = req ? (req.originalUrl || req.path || req.url || null) : path;

  if (typeof finalPath === 'string') {
    finalPath = finalPath.split('?')[0].slice(0, 200);
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    requestId: finalRequestId || null,
    method: finalMethod || null,
    path: finalPath || null,
    reason: reason || null,
  };

  if (counts && typeof counts === 'object') {
    logEntry.counts = counts;
  }

  const jsonLine = JSON.stringify(logEntry);
  if (level === 'error') {
    console.error(jsonLine);
  } else if (level === 'warn') {
    console.warn(jsonLine);
  } else {
    console.log(jsonLine);
  }
}

export default { logSecurityEvent };
