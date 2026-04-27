import request from 'supertest';
import { app } from '../../src/app';

describe('Role-gated route', () => {
  it('200 — Admin role accepted', async () => {
    const res = await request(app)
      .get('/issues')
      .set('x-test-user', JSON.stringify({ sub: 'u1', role: 'Admin' }));
    expect(res.status).toBe(200);
  });

  it('403 — User role rejected', async () => {
    const res = await request(app)
      .get('/issues')
      .set('x-test-user', JSON.stringify({ sub: 'u2', role: 'User' }));
    expect(res.status).toBe(403);
  });

  it('401 — no token rejected', async () => {
    const res = await request(app).get('/issues');
    expect(res.status).toBe(401);
  });
});
