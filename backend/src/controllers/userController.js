import { getCurrentUser } from './authController.js';

export const getCurrentUserProfile = getCurrentUser;

export const getUsers = async (_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Get users list endpoint is not implemented yet',
    },
  });
};

export const getUserById = async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: `Get user profile for ID '${req.params.id}' is not implemented yet`,
    },
  });
};

export const updateUserProfile = async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: `Update user profile for ID '${req.params.id}' is not implemented yet`,
    },
  });
};
