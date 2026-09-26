import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import userStore, { toSafeUser } from '../services/userStore.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Registration Controller (POST /api/auth/register)
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Name is required' },
      });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'A valid email address is required' },
      });
    }

    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        },
      });
    }

    const normalizedEmail = userStore.normalizeEmail(email);

    if (userStore.findByEmail(normalizedEmail)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'A user with this email address already exists',
        },
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = userStore.createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: toSafeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login Controller (POST /api/auth/login)
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Email and password are required',
        },
      });
    }

    const normalizedEmail = userStore.normalizeEmail(email);
    const user = userStore.findByEmail(normalizedEmail);

    const GENERIC_AUTH_ERROR = {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };

    if (!user) {
      return res.status(401).json(GENERIC_AUTH_ERROR);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json(GENERIC_AUTH_ERROR);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Current Authenticated User Controller (GET /api/auth/me)
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = userStore.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found or session expired due to server restart',
        },
      });
    }

    res.status(200).json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout Controller (POST /api/auth/logout)
 */
export const logout = async (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please discard token on client side.',
  });
};
