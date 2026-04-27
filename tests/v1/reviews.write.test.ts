jest.mock('@/prisma', () => ({
  prisma: {
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
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
  review: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const sampleReview = (overrides: Partial<{ id: number; userId: number }> = {}) => ({
  id: overrides.id ?? 1,
  userId: overrides.userId ?? 42,
  mediaId: 550,
  mediaType: 'movie',
  title: 'Loved it',
  body: 'A modern classic',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  user: { id: overrides.userId ?? 42, username: 'alice' },
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET /v1/reviews/:id ──────────────────────────────────────────────────────

describe('GET /v1/reviews/:id', () => {
  // Happy path
  it('returns 200 with the review when it exists', async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(sampleReview());
    const response = await request(app).get('/v1/reviews/1');
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(1);
  });

  // Sad path — not found
  it('returns 404 when review does not exist', async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(null);
    const response = await request(app).get('/v1/reviews/999999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Review not found');
  });

  // Sad path — invalid id
  it('returns 400 when id is not a positive integer', async () => {
    const response = await request(app).get('/v1/reviews/abc');
    expect(response.status).toBe(400);
  });

  // Sad path — DB error
  it('returns 500 when the database throws', async () => {
    mockedPrisma.review.findUnique.mockRejectedValue(new Error('boom'));
    const response = await request(app).get('/v1/reviews/1');
    expect(response.status).toBe(500);
  });
});

// ── POST /v1/reviews ─────────────────────────────────────────────────────────

describe('POST /v1/reviews', () => {
  // Happy path
  it('returns 201 with the created review', async () => {
    mockedPrisma.review.create.mockResolvedValue(sampleReview());
    const response = await request(app)
      .post('/v1/reviews')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'movie', title: 'Loved it', body: 'A modern classic' });
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe(1);
  });

  // Happy path — title is optional
  it('returns 201 when title is omitted', async () => {
    mockedPrisma.review.create.mockResolvedValue(sampleReview());
    const response = await request(app)
      .post('/v1/reviews')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'movie', body: 'A modern classic' });
    expect(response.status).toBe(201);
  });

  // Sad path — no auth
  it('returns 401 when no token is provided', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .send({ mediaId: 550, mediaType: 'movie', body: 'A modern classic' });
    expect(response.status).toBe(401);
  });

  // Sad path — missing body
  it('returns 400 when body is missing', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'movie' });
    expect(response.status).toBe(400);
    expect(mockedPrisma.review.create).not.toHaveBeenCalled();
  });

  // Sad path — invalid mediaType
  it('returns 400 when mediaType is invalid', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'podcast', body: 'A modern classic' });
    expect(response.status).toBe(400);
  });

  // Sad path — missing mediaId
  it('returns 400 when mediaId is missing', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .set(authHeader({ sub: 42 }))
      .send({ mediaType: 'movie', body: 'A modern classic' });
    expect(response.status).toBe(400);
  });

  // Sad path — DB error
  it('returns 500 when the database throws', async () => {
    mockedPrisma.review.create.mockRejectedValue(new Error('boom'));
    const response = await request(app)
      .post('/v1/reviews')
      .set(authHeader({ sub: 42 }))
      .send({ mediaId: 550, mediaType: 'movie', body: 'A modern classic' });
    expect(response.status).toBe(500);
  });
});

// ── PUT /v1/reviews/:id ───────────────────────────────────────────────────────

describe('PUT /v1/reviews/:id', () => {
  // Happy path — author updates their own review
  it('returns 200 with the updated review', async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(sampleReview({ userId: 42 }));
    mockedPrisma.review.update.mockResolvedValue({ ...sampleReview(), body: 'Updated text' });
    const response = await request(app)
      .put('/v1/reviews/1')
      .set(authHeader({ sub: 42 }))
      .send({ body: 'Updated text' });
    expect(response.status).toBe(200);
    expect(response.body.data.body).toBe('Updated text');
  });

  // Sad path — not the author
  it('returns 403 when user is not the author', async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(sampleReview({ userId: 999 }));
    const response = await request(app)
      .put('/v1/reviews/1')
      .set(authHeader({ sub: 42 }))
      .send({ body: 'Updated text' });
    expect(response.status).toBe(403);
  });

  // Sad path — review not found
  it('returns 404 when review does not exist', async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .put('/v1/reviews/999999')
      .set(authHeader({ sub: 42 }))
      .send({ body: 'Updated text' });
    expect(response.status).toBe(404);
  });

  // Sad path — no auth
  it('returns 401 when no token is provided', async () => {
    const response = await request(app).put('/v1/reviews/1').send({ body: 'Updated text' });
    expect(response.status).toBe(401);
  });

  // Sad path — missing body
  it('returns 400 when body is missing', async () => {
    const response = await request(app)
      .put('/v1/reviews/1')
      .set(authHeader({ sub: 42 }))
      .send({});
    expect(response.status).toBe(400);
  });
});

// ── DELETE /v1/reviews/:id ────────────────────────────────────────────────────

describe('DELETE /v1/reviews/:id', () => {
  // Happy path — author deletes their own review
  it('returns 200 when author deletes their own review', async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(sampleReview({ userId: 42 }));
    mockedPrisma.review.delete.mockResolvedValue(sampleReview());
    const response = await request(app)
      .delete('/v1/reviews/1')
      .set(authHeader({ sub: 42 }));
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Successfully deleted');
  });

  // Happy path — admin deletes any review
  it('returns 200 when admin deletes someone elses review', async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(sampleReview({ userId: 42 }));
    mockedPrisma.review.delete.mockResolvedValue(sampleReview());
    const response = await request(app)
      .delete('/v1/reviews/1')
      .set(authHeader({ sub: 99, role: 'ADMIN' }));
    expect(response.status).toBe(200);
  });

  // Sad path — user tries to delete someone else's review
  it('returns 403 when user tries to delete someone elses review', async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(sampleReview({ userId: 999 }));
    const response = await request(app)
      .delete('/v1/reviews/1')
      .set(authHeader({ sub: 42 }));
    expect(response.status).toBe(403);
  });

  // Sad path — review not found
  it('returns 404 when review does not exist', async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .delete('/v1/reviews/999999')
      .set(authHeader({ sub: 42 }));
    expect(response.status).toBe(404);
  });

  // Sad path — no auth
  it('returns 401 when no token is provided', async () => {
    const response = await request(app).delete('/v1/reviews/1');
    expect(response.status).toBe(401);
  });

  // Sad path — invalid id
  it('returns 400 when id is not a positive integer', async () => {
    const response = await request(app)
      .delete('/v1/reviews/abc')
      .set(authHeader({ sub: 42 }));
    expect(response.status).toBe(400);
  });
});
