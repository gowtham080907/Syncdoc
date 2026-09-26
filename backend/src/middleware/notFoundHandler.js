/**
 * Centralized 404 Not Found handler for unmapped routes.
 */
export const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    },
  });
};

export default notFoundHandler;
