import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestIdMiddleware } from '../middleware/request-id';
import { errorHandler, notFoundHandler } from '../middleware/error-handler';

describe('API Gateway — Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(requestIdMiddleware);
  });

  describe('Health Check', () => {
    it('GET /healthz should return 200', async () => {
      app.get('/healthz', (_req, res) => res.status(200).send('ok'));
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.text).toBe('ok');
    });
  });

  describe('Request ID Middleware', () => {
    it('should assign X-Request-Id header', async () => {
      app.get('/test', (req, res) => {
        res.json({ requestId: req.requestId });
      });
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
      expect(res.body.requestId).toBeDefined();
      expect(typeof res.body.requestId).toBe('string');
    });

    it('should preserve existing X-Request-Id header', async () => {
      const existingId = 'custom-request-id-123';
      app.get('/test', (req, res) => {
        res.json({ requestId: req.requestId });
      });
      const res = await request(app)
        .get('/test')
        .set('X-Request-Id', existingId);
      expect(res.status).toBe(200);
      expect(res.body.requestId).toBe(existingId);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers for whitelisted origins', async () => {
      app.get('/test', (_req, res) => res.json({ ok: true }));
      const res = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:4200');
      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    });
  });

  describe('Error Handler', () => {
    it('should return 404 for unknown routes', async () => {
      app.use(notFoundHandler);
      app.use(errorHandler);
      const res = await request(app).get('/nonexistent-route');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'NOT_FOUND');
    });

    it('should return 400 for invalid JSON', async () => {
      app.use(errorHandler);
      const res = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('invalid-json');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'INVALID_JSON');
    });

    it('should return 500 for unhandled errors', async () => {
      app.get('/error', () => {
        throw new Error('Test unhandled error');
      });
      app.use(errorHandler);
      const res = await request(app).get('/error');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'INTERNAL_ERROR');
    });
  });
});
