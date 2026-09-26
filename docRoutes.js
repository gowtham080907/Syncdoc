const express = require('express');
const router = express.Router();
const { Document, flattenTreeToPlainText } = require('../models/Document');
const { astToHtml, sanitizeHtml, generatePdfBuffer } = require('../services/exportService');

// POST /api/docs — create a new document with root AST
router.post('/', async (req, res, next) => {
  try {
    const { title, root, children } = req.body;
    let initialRoot;

    if (root && Array.isArray(root.children)) {
      initialRoot = root;
    } else if (Array.isArray(children)) {
      initialRoot = { children };
    } else {
      initialRoot = { children: [{ type: 'paragraph', text: '' }] };
    }

    const doc = new Document({
      title: title && title.trim() ? title.trim() : 'Untitled Document',
      root: initialRoot,
    });

    const savedDoc = await doc.save();
    res.status(201).json(savedDoc);
  } catch (error) {
    res.status(400);
    next(error);
  }
});

// GET /api/docs — list all documents with plain text preview
router.get('/', async (req, res, next) => {
  try {
    const docs = await Document.find({}).sort({ updatedAt: -1 });
    const result = docs.map((doc) => ({
      _id: doc._id,
      title: doc.title,
      updatedAt: doc.updatedAt,
      preview: flattenTreeToPlainText(doc.root),
    }));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/docs/:id/export/html — Export sanitized HTML file
router.get('/:id/export/html', async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const rawHtml = astToHtml(doc.root, doc.title || 'Untitled Document');
    const cleanHtml = sanitizeHtml(rawHtml);

    const safeTitle = (doc.title || 'document').replace(/[^a-z0-9_-]/gi, '_');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.html"`);
    res.status(200).send(cleanHtml);
  } catch (error) {
    next(error);
  }
});

// GET /api/docs/:id/export/pdf — Export styled PDF document via Puppeteer
router.get('/:id/export/pdf', async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const rawHtml = astToHtml(doc.root, doc.title || 'Untitled Document');
    const cleanHtml = sanitizeHtml(rawHtml);
    const pdfBuffer = await generatePdfBuffer(cleanHtml);

    const safeTitle = (doc.title || 'document').replace(/[^a-z0-9_-]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// GET /api/docs/:id — get one full document
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(200).json(doc);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid document ID format' });
    }
    next(error);
  }
});

// PUT /api/docs/:id — update title and/or root children tree of a document
router.put('/:id', async (req, res, next) => {
  try {
    const { title, root, children } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (title !== undefined) {
      doc.title = title;
    }

    if (root && Array.isArray(root.children)) {
      doc.root = root;
    } else if (Array.isArray(children)) {
      doc.root = { children };
    }

    const savedDoc = await doc.save();
    res.status(200).json(savedDoc);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid document ID format' });
    }
    res.status(400);
    next(error);
  }
});

module.exports = router;
