/**
 * Security Routes for SyncDoc Backend.
 * Defines dev/testing security endpoints.
 */

import express from 'express';
import { sanitizeEndpoint } from '../controllers/securityController.js';
import requireJson from '../middleware/requireJson.js';
import config from '../config/env.js';

const router = express.Router();

router.post('/sanitize', (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isEnabledInProd = process.env.ENABLE_SANITIZE_ENDPOINT === 'true';

  if (isProduction && !isEnabledInProd) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'Sanitize dev endpoint is disabled in production environment',
    });
  }

  return requireJson(req, res, () => sanitizeEndpoint(req, res, next));
});

export default router;
