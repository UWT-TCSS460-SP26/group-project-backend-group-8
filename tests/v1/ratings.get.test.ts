jest.mock('@/prisma', () => ({
  prisma: {
    rating: { aggregate: jest.fn() },
  },
}));

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '@/prisma';

const mockedPrisma = prisma as unknown as {
  rating: { aggregate: jest.Mock };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /v1/ratings', () => {
  // Happy path
  it('returns 200 with average and count for a movie', async () => {
    mockedPrisma.rating.aggregate.mockResolvedValue({
      _avg: { score: 7.5 },
      _count: { _all: 4 },
    });

    const response = await request(app)
      .get('/v1/ratings')
      .query({ mediaId: '550', mediaType: 'movie' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      mediaId: 550,
      mediaType: 'movie',
      average: 7.5,
      count: 4,
    });
    expect(mockedPrisma.rating.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { mediaId: 550, mediaType: 'movie' },
        _avg: { score: true },
        _count: { _all: true },
      })
    );
  });

  // Edge — title with no ratings returns null average and count 0
  it('returns null average and zero count when no ratings exist', async () => {
    mockedPrisma.rating.aggregate.mockResolvedValue({
      _avg: { score: null },
      _count: { _all: 0 },
    });

    const response = await request(app)
      .get('/v1/ratings')
      .query({ mediaId: '999999', mediaType: 'movie' });

    expect(response.status).toBe(200);
    expect(response.body.data.average).toBeNull();
    expect(response.body.data.count).toBe(0);
  });

  // Happy path — TV mediaType
  it('aggregates ratings for a TV series', async () => {
    mockedPrisma.rating.aggregate.mockResolvedValue({
      _avg: { score: 9.1 },
      _count: { _all: 12 },
    });

    const response = await request(app)
      .get('/v1/ratings')
      .query({ mediaId: '1399', mediaType: 'tv' });

    expect(response.status).toBe(200);
    expect(response.body.data.mediaType).toBe('tv');
    expect(mockedPrisma.rating.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mediaId: 1399, mediaType: 'tv' } })
    );
  });

  // Sad path — missing mediaId
  it('returns 400 when mediaId is missing', async () => {
    const response = await request(app).get('/v1/ratings').query({ mediaType: 'movie' });
    expect(response.status).toBe(400);
    expect(mockedPrisma.rating.aggregate).not.toHaveBeenCalled();
  });

  // Sad path — invalid mediaType
  it('returns 400 when mediaType is invalid', async () => {
    const response = await request(app)
      .get('/v1/ratings')
      .query({ mediaId: '550', mediaType: 'audiobook' });
    expect(response.status).toBe(400);
  });

  // Sad path — negative mediaId
  it('returns 400 when mediaId is negative', async () => {
    const response = await request(app)
      .get('/v1/ratings')
      .query({ mediaId: '-3', mediaType: 'movie' });
    expect(response.status).toBe(400);
  });

  // Sad path — DB error
  it('returns 500 when the database throws', async () => {
    mockedPrisma.rating.aggregate.mockRejectedValue(new Error('boom'));

    const response = await request(app)
      .get('/v1/ratings')
      .query({ mediaId: '550', mediaType: 'movie' });
    expect(response.status).toBe(500);
  });
});
