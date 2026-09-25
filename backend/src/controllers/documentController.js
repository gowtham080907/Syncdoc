import documentStore from '../services/documentStore.js';
import userStore from '../services/userStore.js';

/**
 * Get All Documents Controller (GET /api/documents)
 */
export const getAllDocuments = async (_req, res, next) => {
  try {
    const documents = documentStore.getAllDocuments();
    res.status(200).json(documents);
  } catch (err) {
    next(err);
  }
};

/**
 * Get Document By ID Controller (GET /api/documents/:id)
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const document = documentStore.getDocumentById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: `Document with ID '${req.params.id}' was not found.`,
        },
      });
    }

    res.status(200).json(document);
  } catch (err) {
    next(err);
  }
};

/**
 * Create Document Controller (POST /api/documents)
 */
export const createDocument = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    let author = {
      id: req.user?.id || 'usr-me',
      name: req.user?.email || 'Authenticated User',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    };

    if (req.user?.id) {
      const user = userStore.findById(req.user.id);
      if (user) {
        author = {
          id: user.id,
          name: user.name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
        };
      }
    }

    const document = documentStore.createDocument({
      title,
      description,
      author,
    });

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Document Controller (PUT/PATCH /api/documents/:id)
 */
export const updateDocument = async (req, res, next) => {
  try {
    const updatedDocument = documentStore.updateDocument(req.params.id, req.body);

    if (!updatedDocument) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: `Document with ID '${req.params.id}' was not found.`,
        },
      });
    }

    res.status(200).json(updatedDocument);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Document Controller (DELETE /api/documents/:id)
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const deleted = documentStore.deleteDocument(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: `Document with ID '${req.params.id}' was not found.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Document '${req.params.id}' deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

