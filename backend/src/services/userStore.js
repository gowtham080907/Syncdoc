import bcrypt from 'bcryptjs';

/**
 * In-Memory User Store
 * NOTE: Data is stored purely in memory and resets on server restart.
 * Swapping in a real DB in the future requires modifying only this service module.
 */

const users = [];
let nextId = 1;

/**
 * Normalizes email address (lowercase + trim).
 */
export const normalizeEmail = (email = '') => {
  return email.trim().toLowerCase();
};

/**
 * Strips passwordHash and sensitive properties from user object.
 */
export const toSafeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

/**
 * Finds a user by normalized email.
 */
export const findByEmail = (email) => {
  const normalized = normalizeEmail(email);
  return users.find((u) => u.email === normalized) || null;
};

/**
 * Finds a user by ID.
 */
export const findById = (id) => {
  return users.find((u) => String(u.id) === String(id)) || null;
};

/**
 * Creates and stores a new user record in memory.
 * Throws an error if email already exists.
 */
export const createUser = ({ name, email, passwordHash }) => {
  const normalized = normalizeEmail(email);

  if (findByEmail(normalized)) {
    const error = new Error('A user with this email address already exists');
    error.statusCode = 409;
    error.code = 'DUPLICATE_EMAIL';
    throw error;
  }

  const user = {
    id: `usr-${nextId++}`,
    name: name.trim(),
    email: normalized,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  return user;
};

/**
 * Seeds default demo users if store is empty.
 */
export const seedDefaultUsers = () => {
  if (users.length === 0) {
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    createUser({ name: 'Alex Rivera', email: 'alex.rivera@syncdoc.io', passwordHash: defaultPasswordHash });
    createUser({ name: 'Sree V', email: 'sree.v@syncdoc.io', passwordHash: defaultPasswordHash });
    createUser({ name: 'David Chen', email: 'david.chen@syncdoc.io', passwordHash: defaultPasswordHash });
    createUser({ name: 'Elena Rostova', email: 'elena.rostova@syncdoc.io', passwordHash: defaultPasswordHash });
  }
};

// Seed on initial module load
seedDefaultUsers();

/**
 * Resets the in-memory user store (used for test isolation).
 */
export const resetStore = () => {
  users.length = 0;
  nextId = 1;
};

export default {
  createUser,
  findByEmail,
  findById,
  resetStore,
  seedDefaultUsers,
  toSafeUser,
  normalizeEmail,
};

