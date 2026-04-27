import request from 'supertest';
import { app } from '../../src/app';

describe('POST /issues', () => {
  it('201 — creates a valid bug report', async () => {
    const res = await request(app)
      .post('/issues')
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
    const res = await request(app)
      .post('/issues')
      .send({ title: '   ', description: '' });
    expect(res.status).toBe(400);
  });
});