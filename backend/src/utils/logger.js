import config from '../config/env.js';

export const logger = {
  info: (message, ...meta) => {
    if (!config.isTest) {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...meta);
    }
  },
  warn: (message, ...meta) => {
    if (!config.isTest) {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...meta);
    }
  },
  error: (message, ...meta) => {
    if (!config.isTest) {
      console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...meta);
    }
  },
};

export default logger;
