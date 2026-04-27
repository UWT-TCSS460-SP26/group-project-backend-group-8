import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';

const SECRET = 'test-secret';
beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

function makeToken(role: string) {
  return jwt.sign({ sub: 'u1', email: 'test@uw.edu', role }, SECRET);
}

describe.skip('Role-gated route', () => {
  it('200 — Admin role accepted', async () => {
    const res = await request(app)
      .get('/issues')
      .set('Authorization', `Bearer ${makeToken('Admin')}`);
    expect(res.status).toBe(200);
  });

  it('403 — User role rejected', async () => {
    const res = await request(app)
      .get('/issues')
      .set('Authorization', `Bearer ${makeToken('User')}`);
    expect(res.status).toBe(403);
  });

  it('401 — no token rejected', async () => {
    const res = await request(app).get('/issues');
    expect(res.status).toBe(401);
  });
});
