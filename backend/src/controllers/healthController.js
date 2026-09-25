/**
 * Health Controller
 */
export const getHealthStatus = (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Syncdoc backend is running',
  });
};
