/**
 * Export Controller for SyncDoc backend.
 * Handles AST -> PDF export requests.
 */

import validateAST from '../utils/astValidator.js';
import { sanitizeAST } from '../services/sanitizer.js';
import transformAST from '../services/astTransformer.js';
import generatePDF from '../services/pdfGenerator.js';
import { logSecurityEvent } from '../utils/securityLogger.js';

/**
 * Controller handler for POST /api/export/pdf
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function exportPDF(req, res, next) {
  try {
    const { ast } = req.body || {};

    if (!req.body || typeof req.body !== 'object' || !ast || typeof ast !== 'object' || Array.isArray(ast)) {
      logSecurityEvent({
        level: 'warn',
        event: 'security.validation_failed',
        req,
        reason: 'Missing or non-object AST body',
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid AST',
        details: [
          {
            path: 'ast',
            message: 'Request body must be a JSON object containing a valid "ast" document property',
          },
        ],
      });
    }

    const validationResult = validateAST(ast);
    if (!validationResult.valid) {
      logSecurityEvent({
        level: 'warn',
        event: 'security.validation_failed',
        req,
        reason: 'AST schema validation failed',
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid AST',
        details: validationResult.errors,
      });
    }

    const sanitizedAST = sanitizeAST(ast, { req, requestId: req.requestId });
    const irDocument = transformAST(sanitizedAST);
    const pdfBuffer = await generatePDF(irDocument);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    res.setHeader('Content-Length', Buffer.byteLength(pdfBuffer));

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
}

export default { exportPDF };
