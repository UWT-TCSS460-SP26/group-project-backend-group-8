import request from 'supertest';
import { app } from '../src/app';

describe('Story 7 — predictable errors and health check', () => {
  // /health returns a small success payload at a documented path.
  it('exposes /health returning 200 alive', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('alive');
  });

  // 404s carry a structured JSON body, not an HTML stack page.
  it('returns a JSON envelope on unknown routes', async () => {
    const response = await request(app).get('/this-route-does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Route not found' });
    expect(JSON.stringify(response.body)).not.toMatch(/at .*\(/); // no stack frames
  });

  // Validation errors carry a structured 400 with a documented `error` field —
  // never an exception message bubbled up from Zod or the controller.
  it('returns a structured 400 on validation failure', async () => {
    const response = await request(app).post('/v1/issues').send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(JSON.stringify(response.body)).not.toMatch(/at .*\(/);
  });
});
