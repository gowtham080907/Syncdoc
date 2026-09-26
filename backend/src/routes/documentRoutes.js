import { Router } from 'express';
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/documentController.js';
import { validateRequiredFields } from '../middleware/validateFields.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Protect all document endpoints with JWT authentication middleware
router.use(authMiddleware);

router.get('/', getAllDocuments);
router.post('/', validateRequiredFields(['title']), createDocument);
router.get('/:id', getDocumentById);
router.put('/:id', updateDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;

