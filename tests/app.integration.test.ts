import request from 'supertest';
import { app } from '../src/app';

describe('GET /health', () => {
  // Happy path
  it('should return 200 and status alive', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('alive');
  });

  // Sad path — wrong HTTP method
  it('should return 404 for a POST to /health', async () => {
    const response = await request(app).post('/health');
    expect(response.status).toBe(404);
  });
});

describe('GET /openapi.json', () => {
  // Happy path
  it('should return 200 with a valid OpenAPI spec', async () => {
    const response = await request(app).get('/openapi.json');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('openapi');
    expect(response.body).toHaveProperty('info');
    expect(response.body.info).toHaveProperty('title');
  });

  // Sad path — wrong HTTP method
  it('should return 404 for a POST to /openapi.json', async () => {
    const response = await request(app).post('/openapi.json');
    expect(response.status).toBe(404);
  });
});

describe('CORS allowlist', () => {
  it('echoes the access-control-allow-origin header for an allowed origin', async () => {
    const response = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('omits the access-control-allow-origin header for a disallowed origin', async () => {
    const response = await request(app)
      .options('/health')
      .set('Origin', 'http://evil.example.com')
      .set('Access-Control-Request-Method', 'GET');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('404 handler', () => {
  // Sad path — route does not exist
  it('should return 404 with an error message for an unknown route', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Route not found');
  });

  // Sad path — POST to unknown route
  it('should return 404 for a POST to an unknown route', async () => {
    const response = await request(app).post('/nonexistent');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Route not found');
  });
});
