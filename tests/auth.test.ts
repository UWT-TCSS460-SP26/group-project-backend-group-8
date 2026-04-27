jest.mock('@/prisma', () => ({
  prisma: {
    user: {
      upsert: jest.fn().mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'testuser@dev.local',
        role: 'USER',
      }),
    },
  },
}));

import request from 'supertest';
import { app } from '../src/app';

describe('POST /auth/dev-login', () => {
  // Happy path
  it('returns 200 with a token when username is provided', async () => {
    const response = await request(app).post('/auth/dev-login').send({ username: 'testuser' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
  });

  // Sad path — missing username
  it('returns 400 when username is missing', async () => {
    const response = await request(app).post('/auth/dev-login').send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('username is required');
  });
});
