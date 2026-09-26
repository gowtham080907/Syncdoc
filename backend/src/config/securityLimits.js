/**
 * Centralized Security Limits & Configuration for SyncDoc Backend.
 */

import logger from '../utils/logger.js';

function parsePositiveIntEnv(key, defaultVal, aliasKey = null) {
  const envVal = process.env[key] || (aliasKey ? process.env[aliasKey] : undefined);
  if (envVal === undefined || envVal === '') {
    return defaultVal;
  }
  const parsed = parseInt(envVal, 10);
  if (isNaN(parsed) || parsed <= 0) {
    logger.warn(`[SECURITY CONFIG] Invalid value "${envVal}" for ${key}. Falling back to default ${defaultVal}.`);
    return defaultVal;
  }
  return parsed;
}

export const MAX_AST_DEPTH = parsePositiveIntEnv('MAX_AST_DEPTH', 100, 'AST_MAX_DEPTH');
export const MAX_AST_NODES = parsePositiveIntEnv('MAX_AST_NODES', 50000, 'AST_MAX_NODES');
export const MAX_TEXT_LENGTH = parsePositiveIntEnv('MAX_TEXT_LENGTH', 100000);
export const MAX_HTML_LENGTH = parsePositiveIntEnv('MAX_HTML_LENGTH', 200000);
export const MAX_URL_LENGTH = parsePositiveIntEnv('MAX_URL_LENGTH', 2048);
export const MAX_SANITIZE_CALLS = parsePositiveIntEnv('MAX_SANITIZE_CALLS', 1000);
export const MAX_REQUEST_BODY = process.env.MAX_REQUEST_BODY || process.env.MAX_EXPORT_BODY_SIZE || '2mb';

export default {
  MAX_AST_DEPTH,
  MAX_AST_NODES,
  MAX_TEXT_LENGTH,
  MAX_HTML_LENGTH,
  MAX_URL_LENGTH,
  MAX_SANITIZE_CALLS,
  MAX_REQUEST_BODY,
};
