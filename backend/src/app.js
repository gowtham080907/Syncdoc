import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import requestLogger from './middleware/requestLogger.js';
import requestIdMiddleware from './middleware/requestId.js';
import securityHeadersMiddleware from './middleware/securityHeaders.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import securityRoutes from './routes/securityRoutes.js';

const app = express();

// Security & Request Identification Middleware
app.use(requestIdMiddleware);
app.use(securityHeadersMiddleware);

// Security & Parsing Middleware
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
const maxBodyLimit = process.env.MAX_REQUEST_BODY || process.env.MAX_EXPORT_BODY_SIZE || '2mb';
app.use(express.json({ limit: maxBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: maxBodyLimit }));

// Request Logging Middleware
app.use(requestLogger);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/security', securityRoutes);

// Test-only route for testing error handler
if (config.isTest) {
  app.get('/api/test-error', (_req, _res, next) => {
    const error = new Error('Test server error');
    error.statusCode = 500;
    next(error);
  });
}

// Centralized 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
