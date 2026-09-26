import request from 'supertest';
import app from '../src/app.js';
import userStore from '../src/services/userStore.js';
import documentStore from '../src/services/documentStore.js';

describe('Syncdoc Document API & Middleware Test Suite', () => {
  let token;
  let userId;

  beforeEach(async () => {
    userStore.resetStore();
    userStore.seedDefaultUsers();
    documentStore.resetStore();

    // Login as a seed user to get a valid token
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'sree.v@syncdoc.io',
      password: 'password123',
    });

    token = loginRes.body.token;
    userId = loginRes.body.user.id;
  });

  describe('Authentication protection on /api/documents', () => {
    it('GET /api/documents should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/documents');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/documents should reject unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/documents').send({ title: 'Test' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/documents/:id should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/documents/doc-1');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/documents/:id should reject unauthenticated requests with 401', async () => {
      const res = await request(app).put('/api/documents/doc-1').send({ title: 'Updated' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('DELETE /api/documents/:id should reject unauthenticated requests with 401', async () => {
      const res = await request(app).delete('/api/documents/doc-1');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Authenticated Document CRUD Operations', () => {
    it('GET /api/documents should return document list for authenticated user', async () => {
      const res = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
    });

    it('GET /api/documents/:id should return details for an existing document', async () => {
      const res = await request(app)
        .get('/api/documents/doc-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 'doc-1');
      expect(res.body).toHaveProperty('blocks');
      expect(Array.isArray(res.body.blocks)).toBe(true);
    });

    it('GET /api/documents/:id should return 404 for non-existent document', async () => {
      const res = await request(app)
        .get('/api/documents/non-existent-doc-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });

    it('POST /api/documents should create a new document with valid title', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Architecture Spec',
          description: 'Testing creation endpoint',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('New Architecture Spec');
      expect(res.body.description).toBe('Testing creation endpoint');
      expect(res.body.author.id).toBe(userId);
    });

    it('POST /api/documents should fail with 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Missing title' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/documents/:id should update an existing document', async () => {
      const res = await request(app)
        .put('/api/documents/doc-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Document Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Document Title');
    });

    it('DELETE /api/documents/:id should delete an existing document', async () => {
      const res = await request(app)
        .delete('/api/documents/doc-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const getRes = await request(app)
        .get('/api/documents/doc-1')
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(404);
    });
  });
});
