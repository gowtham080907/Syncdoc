import request from 'supertest';
import app from '../src/app.js';
import userStore from '../src/services/userStore.js';

describe('Syncdoc Week 2 Authentication & User API Suite', () => {
  beforeEach(() => {
    userStore.resetStore();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return 201 with safe user object', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('name', 'Jane Doe');
      expect(response.body.user).toHaveProperty('email', 'jane@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration when name is missing (400)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_NAME');
    });

    it('should reject registration when email format is invalid (400)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_EMAIL');
    });

    it('should reject registration when password is less than 8 characters (400)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('should reject registration when email is already registered (409)', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

      const duplicateResponse = await request(app).post('/api/auth/register').send({
        name: 'Jane Duplicate',
        email: 'JANE@EXAMPLE.COM', // Tests case-insensitive email normalization
        password: 'password123',
      });

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123',
      });
    });

    it('should authenticate user with valid credentials and return JWT token', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
        password: 'securePassword123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'john@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return generic 401 error for incorrect password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
        password: 'wrongPassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should return generic 401 error for non-existent email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'securePassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should return 400 when email or password is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });
  });

  describe('JWT Auth Middleware & Protected Endpoints', () => {
    let authToken;

    beforeEach(async () => {
      const regRes = await request(app).post('/api/auth/register').send({
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: 'password123',
      });
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'alice@example.com',
        password: 'password123',
      });
      authToken = loginRes.body.token;
    });

    it('GET /api/auth/me should return safe user profile when given valid Bearer token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('name', 'Alice Smith');
      expect(response.body.user).toHaveProperty('email', 'alice@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('GET /api/users/me should return safe user profile when given valid Bearer token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('email', 'alice@example.com');
    });

    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when Authorization token is invalid or tampered', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-tampered-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return success response with clear message', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });
  });
});
