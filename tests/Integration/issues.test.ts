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

describe.skip('POST /issues', () => {
  it('201 — creates a valid bug report', async () => {
    const res = await request(app)
      .post('/issues')
      .set('Authorization', `Bearer ${makeToken('User')}`)
      .send({ title: 'Login broken', description: 'Returns 500 on POST /auth' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('400 — rejects report with no title and no description', async () => {
    const res = await request(app).post('/issues').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 — rejects report with only whitespace', async () => {
    const res = await request(app).post('/issues').send({ title: '   ', description: '' });
    expect(res.status).toBe(400);
  });
});
