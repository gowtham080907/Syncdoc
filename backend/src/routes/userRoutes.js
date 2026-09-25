import { Router } from 'express';
import {
  getCurrentUserProfile,
  getUsers,
  getUserById,
  updateUserProfile,
} from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.get('/me', authMiddleware, getCurrentUserProfile);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUserProfile);

export default router;
