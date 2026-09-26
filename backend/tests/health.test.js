import request from 'supertest';
import app from '../src/app.js';

describe('Syncdoc Backend Core & Health API Suite', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK with success flag and running message', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Syncdoc backend is running',
      });
    });
  });

  describe('Centralized 404 Not Found Handler', () => {
    it('should return 404 Not Found JSON error for unmapped route', async () => {
      const response = await request(app).get('/api/non-existent-endpoint');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error.message).toContain('Route not found');
    });
  });

  describe('Unimplemented Placeholder 501 Routes', () => {
    it('GET /api/users should return 501 Not Implemented', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_IMPLEMENTED');
    });

    it('GET /api/documents without auth should return 401 Unauthorized', async () => {
      const response = await request(app).get('/api/documents');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Centralized Error Handler', () => {
    it('should catch thrown errors and return formatted JSON response', async () => {
      const response = await request(app).get('/api/test-error');
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message', 'Test server error');
    });
  });
});
