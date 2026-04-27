// jest.mock is hoisted above the app import.
jest.mock('@/prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '@/prisma';

const mockedPrisma = prisma as unknown as {
  review: { findMany: jest.Mock; count: jest.Mock };
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

describe('GET /v1/reviews', () => {
  // Happy path
  it('returns 200 with paginated reviews and metadata', async () => {
    mockedPrisma.review.findMany.mockResolvedValue([sampleReview()]);
    mockedPrisma.review.count.mockResolvedValue(1);

    const response = await request(app)
      .get('/v1/reviews')
      .query({ mediaId: '550', mediaType: 'movie' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toEqual({ page: 1, limit: 25, total: 1, totalPages: 1 });
    expect(mockedPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { mediaId: 550, mediaType: 'movie' },
        skip: 0,
        take: 25,
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  // Happy path — explicit pagination + sort
  it('honors page, limit, sort, and order', async () => {
    mockedPrisma.review.findMany.mockResolvedValue([]);
    mockedPrisma.review.count.mockResolvedValue(53);

    const response = await request(app).get('/v1/reviews').query({
      mediaId: '550',
      mediaType: 'movie',
      page: '2',
      limit: '10',
      sort: 'id',
      order: 'asc',
    });

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({ page: 2, limit: 10, total: 53, totalPages: 6 });
    expect(mockedPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10, orderBy: { id: 'asc' } })
    );
  });

  // Edge — empty result is 200, not 404
  it('returns 200 with empty data when no reviews exist for the title', async () => {
    mockedPrisma.review.findMany.mockResolvedValue([]);
    mockedPrisma.review.count.mockResolvedValue(0);

    const response = await request(app)
      .get('/v1/reviews')
      .query({ mediaId: '999999', mediaType: 'movie' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
  });

  // Edge — limit clamped at 100
  it('rejects limit above 100 with 400', async () => {
    const response = await request(app)
      .get('/v1/reviews')
      .query({ mediaId: '550', mediaType: 'movie', limit: '5000' });

    expect(response.status).toBe(400);
    expect(mockedPrisma.review.findMany).not.toHaveBeenCalled();
  });

  // Edge — invalid sort rejected by Zod
  it('returns 400 when sort is not in the allowlist', async () => {
    const response = await request(app)
      .get('/v1/reviews')
      .query({ mediaId: '550', mediaType: 'movie', sort: 'userId; DROP TABLE' });

    expect(response.status).toBe(400);
    expect(mockedPrisma.review.findMany).not.toHaveBeenCalled();
  });

  // Sad path — missing mediaId
  it('returns 400 when mediaId is missing', async () => {
    const response = await request(app).get('/v1/reviews').query({ mediaType: 'movie' });
    expect(response.status).toBe(400);
  });

  // Sad path — invalid mediaType
  it('returns 400 when mediaType is not movie/tv', async () => {
    const response = await request(app)
      .get('/v1/reviews')
      .query({ mediaId: '550', mediaType: 'podcast' });
    expect(response.status).toBe(400);
  });

  // Sad path — non-numeric mediaId
  it('returns 400 when mediaId is non-numeric', async () => {
    const response = await request(app)
      .get('/v1/reviews')
      .query({ mediaId: 'abc', mediaType: 'movie' });
    expect(response.status).toBe(400);
  });

  // Edge — TV mediaType passes through
  it('queries with mediaType="tv" when requested', async () => {
    mockedPrisma.review.findMany.mockResolvedValue([]);
    mockedPrisma.review.count.mockResolvedValue(0);

    await request(app).get('/v1/reviews').query({ mediaId: '1399', mediaType: 'tv' });
    expect(mockedPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mediaId: 1399, mediaType: 'tv' } })
    );
  });

  // Sad path — DB error
  it('returns 500 when the database throws', async () => {
    mockedPrisma.review.findMany.mockRejectedValue(new Error('boom'));
    mockedPrisma.review.count.mockResolvedValue(0);

    const response = await request(app)
      .get('/v1/reviews')
      .query({ mediaId: '550', mediaType: 'movie' });
    expect(response.status).toBe(500);
  });
});
