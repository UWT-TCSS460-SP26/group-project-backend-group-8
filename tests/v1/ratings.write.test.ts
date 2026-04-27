jest.mock('@/prisma', () => ({
  prisma: {
    rating: {
      findUnique: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '@/prisma';
import { authHeader } from '../helpers';

const mockedPrisma = prisma as unknown as {
  rating: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const sampleRating = (overrides: Partial<{ id: number; userId: number }> = {}) => ({
  id: overrides.id ?? 1,
  userId: overrides.userId ?? 42,
  mediaId: 550,
  mediaType: 'movie',
  score: 8.5,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET /v1/ratings/:id ───────────────────────────────────────────────────────

describe('GET /v1/ratings/:id', () => {
  // Happy path
  it('returns 200 with the rating when it exists', async () => {
    mockedPrisma.rating.findUnique.mockResolvedValue(sampleRating());
    const response = await request(app).get('/v1/ratings/1');
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(1);
  });

  // Sad path — not found
  it('returns 404 when rating does not exist', async () => {
    mockedPrisma.rating.findUnique.mockResolvedValue(null);
    const response = await request(app).get('/v1/ratings/999999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Rating not found');
  });

  // Sad path — invalid id
  it('returns 400 when id is not a positive integer', async () => {
    const response = await request(app).get('/v1/ratings/abc');
    expect(response.status).toBe(400);
  });

  // Sad path — DB error
  it('returns 500 when the database throws', async () => {
    mockedPrisma.rating.findUnique.mockRejectedValue(new Error('boom'));
    const response = await request(app).get('/v1/ratings/1');
    expect(response.status).toBe(500);
  });
});

// ── POST /v1/ratings ──────────────────────────────────────────────────────────

describe('POST /v1/ratings', () => {
  // Happy path
  it('returns 201 with the created rating', async () => {
    mockedPrisma.rating.create.mockResolvedValue(sampleRating());
    const response = await request(app)
      .post('/v1/ratings')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'movie', score: 8.5 });
    expect(response.status).toBe(201);
    expect(response.body.data.score).toBe(8.5);
  });

  // Sad path — no auth
  it('returns 401 when no token is provided', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .send({ mediaId: 550, mediaType: 'movie', score: 8.5 });
    expect(response.status).toBe(401);
  });

  // Sad path — missing score
  it('returns 400 when score is missing', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'movie' });
    expect(response.status).toBe(400);
    expect(mockedPrisma.rating.create).not.toHaveBeenCalled();
  });

  // Sad path — score out of range
  it('returns 400 when score is above 10', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'movie', score: 11 });
    expect(response.status).toBe(400);
  });

  // Sad path — score below 1
  it('returns 400 when score is below 1', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'movie', score: 0 });
    expect(response.status).toBe(400);
  });

  // Sad path — invalid mediaType
  it('returns 400 when mediaType is invalid', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'podcast', score: 8.5 });
    expect(response.status).toBe(400);
  });

  // Sad path — DB error
  it('returns 500 when the database throws', async () => {
    mockedPrisma.rating.create.mockRejectedValue(new Error('boom'));
    const response = await request(app)
      .post('/v1/ratings')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'movie', score: 8.5 });
    expect(response.status).toBe(500);
  });
});

// ── PUT /v1/ratings/:id ───────────────────────────────────────────────────────

describe('PUT /v1/ratings/:id', () => {
  // Happy path — author updates their own rating
  it('returns 200 with the updated rating', async () => {
    mockedPrisma.rating.findUnique.mockResolvedValue(sampleRating({ userId: 42 }));
    mockedPrisma.rating.update.mockResolvedValue({ ...sampleRating(), score: 9.0 });
    const response = await request(app)
      .put('/v1/ratings/1')
      .set(authHeader({ sub: 42 }))
      .send({ score: 9.0 });
    expect(response.status).toBe(200);
    expect(response.body.data.score).toBe(9.0);
  });

  // Sad path — not the author
  it('returns 403 when user is not the author', async () => {
    mockedPrisma.rating.findUnique.mockResolvedValue(sampleRating({ userId: 999 }));
    const response = await request(app)
      .put('/v1/ratings/1')
      .set(authHeader({ sub: 42 }))
      .send({ score: 9.0 });
    expect(response.status).toBe(403);
  });

  // Sad path — rating not found
  it('returns 404 when rating does not exist', async () => {
    mockedPrisma.rating.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .put('/v1/ratings/999999')
      .set(authHeader({ sub: 42 }))
      .send({ score: 9.0 });
    expect(response.status).toBe(404);
  });

  // Sad path — no auth
  it('returns 401 when no token is provided', async () => {
    const response = await request(app).put('/v1/ratings/1').send({ score: 9.0 });
    expect(response.status).toBe(401);
  });

  // Sad path — score out of range
  it('returns 400 when score is above 10', async () => {
    const response = await request(app)
      .put('/v1/ratings/1')
      .set(authHeader({ sub: 42 }))
      .send({ score: 11 });
    expect(response.status).toBe(400);
  });

  // Sad path — missing score
  it('returns 400 when score is missing', async () => {
    const response = await request(app)
      .put('/v1/ratings/1')
      .set(authHeader({ sub: 42 }))
      .send({});
    expect(response.status).toBe(400);
  });
});

// ── DELETE /v1/ratings/:id ────────────────────────────────────────────────────

describe('DELETE /v1/ratings/:id', () => {
  // Happy path — author deletes their own rating
  it('returns 200 when author deletes their own rating', async () => {
    mockedPrisma.rating.findUnique.mockResolvedValue(sampleRating({ userId: 42 }));
    mockedPrisma.rating.delete.mockResolvedValue(sampleRating());
    const response = await request(app)
      .delete('/v1/ratings/1')
      .set(authHeader({ sub: 42 }));
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Successfully deleted');
  });

  // Sad path — user tries to delete someone else's rating
  it('returns 403 when user tries to delete someone elses rating', async () => {
    mockedPrisma.rating.findUnique.mockResolvedValue(sampleRating({ userId: 999 }));
    const response = await request(app)
      .delete('/v1/ratings/1')
      .set(authHeader({ sub: 42 }));
    expect(response.status).toBe(403);
  });

  // Sad path — rating not found
  it('returns 404 when rating does not exist', async () => {
    mockedPrisma.rating.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .delete('/v1/ratings/999999')
      .set(authHeader({ sub: 42 }));
    expect(response.status).toBe(404);
  });

  // Sad path — no auth
  it('returns 401 when no token is provided', async () => {
    const response = await request(app).delete('/v1/ratings/1');
    expect(response.status).toBe(401);
  });

  // Sad path — invalid id
  it('returns 400 when id is not a positive integer', async () => {
    const response = await request(app)
      .delete('/v1/ratings/abc')
      .set(authHeader({ sub: 42 }));
    expect(response.status).toBe(400);
  });
});
