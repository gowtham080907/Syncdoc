import http from 'http';
import app from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import { setupWebSocketServer } from './collaboration/websocketServer.js';

const PORT = config.port;

const server = http.createServer(app);
setupWebSocketServer(server);

server.listen(PORT, () => {
  logger.info(`Syncdoc backend server started on port ${PORT} [${config.nodeEnv}]`);
  logger.info(`Health check available at http://localhost:${PORT}/api/health`);
  logger.info(`Real-time collaboration WebSocket available at ws://localhost:${PORT}/ws/collaboration`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

export default server;
