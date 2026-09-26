/**
 * Export Routes for SyncDoc backend.
 * Defines API endpoints for exporting documents.
 */

import express from 'express';
import { exportPDF } from '../controllers/exportController.js';
import requireJson from '../middleware/requireJson.js';

const router = express.Router();

const maxBodySize = process.env.MAX_EXPORT_BODY_SIZE || '2mb';

router.post(
  '/pdf',
  requireJson,
  express.json({ limit: maxBodySize }),
  (err, _req, res, next) => {
    if (err) {
      if (err.type === 'entity.too.large' || err.status === 413) {
        return res.status(413).json({
          success: false,
          error: 'Payload Too Large',
          message: `Request body exceeds maximum size limit of ${maxBodySize}`,
        });
      }
      if (err instanceof SyntaxError || err.status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON',
          details: [{ path: 'body', message: 'Malformed JSON payload' }],
        });
      }
      return next(err);
    }
    next();
  },
  exportPDF
);

export default router;
