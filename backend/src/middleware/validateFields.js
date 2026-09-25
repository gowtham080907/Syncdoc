/**
 * Reusable higher-order validation middleware that checks presence of required body fields.
 * @param {string[]} requiredFields Array of field names required in req.body
 */
export const validateRequiredFields = (requiredFields = []) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Request body must be a valid JSON object',
        },
      });
    }

    const missingFields = requiredFields.filter(
      (field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === ''
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: `Missing required body fields: ${missingFields.join(', ')}`,
          missingFields,
        },
      });
    }

    next();
  };
};

export default validateRequiredFields;
