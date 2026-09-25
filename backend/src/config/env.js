import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';
const isTest = nodeEnv === 'test';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isDevelopment || isTest) {
    console.warn(
      '[WARN] JWT_SECRET is not set in environment. Using default development secret. DO NOT USE IN PRODUCTION!'
    );
    jwtSecret = 'dev-secret-key-change-in-production-12345';
  } else {
    throw new Error('FATAL: JWT_SECRET environment variable must be set in production environment!');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  isDevelopment,
  isTest,
};

export default config;
