import request from 'supertest';

const mockRatingAggregate = jest.fn();
const mockReviewCount = jest.fn();
const mockReviewFindMany = jest.fn();

jest.mock('@/prisma', () => ({
  prisma: {
    rating: { aggregate: (...args: unknown[]) => mockRatingAggregate(...args) },
    review: {
      count: (...args: unknown[]) => mockReviewCount(...args),
      findMany: (...args: unknown[]) => mockReviewFindMany(...args),
    },
  },
}));

import { app } from '../../src/app';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const tmdbResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
});

beforeEach(() => {
  mockFetch.mockReset();
  mockRatingAggregate.mockReset();
  mockReviewCount.mockReset();
  mockReviewFindMany.mockReset();
  process.env.TMDB_API_KEY = 'test-api-key';
});

describe('GET /v1/movie/details/:id/enriched', () => {
  // Happy path — TMDB + community combined
  it('returns 200 with combined tmdb + community payload', async () => {
    mockFetch.mockResolvedValue(
      tmdbResponse({
        id: 550,
        title: 'Fight Club',
        overview: 'syn',
        release_date: '1999-10-15',
        poster_path: '/x.jpg',
      })
    );
    mockRatingAggregate.mockResolvedValue({ _avg: { score: 8.5 }, _count: { _all: 12 } });
    mockReviewCount.mockResolvedValue(3);
    mockReviewFindMany.mockResolvedValue([
      { id: 1, body: 'great', userId: 5, mediaId: 550, mediaType: 'movie' },
    ]);

    const response = await request(app).get('/v1/movie/details/550/enriched');

    expect(response.status).toBe(200);
    expect(response.body.data.tmdb).toMatchObject({ id: 550, title: 'Fight Club' });
    expect(response.body.data.community).toEqual({
      averageScore: 8.5,
      ratingCount: 12,
      reviewCount: 3,
      recentReviews: [expect.objectContaining({ id: 1, body: 'great' })],
    });
  });

  // Edge — zero ratings/reviews returns null avg + zero counts + empty list
  it('returns null average and empty list when there are no ratings or reviews', async () => {
    mockFetch.mockResolvedValue(
      tmdbResponse({ id: 1, title: 'X', overview: '', release_date: '', poster_path: '' })
    );
    mockRatingAggregate.mockResolvedValue({ _avg: { score: null }, _count: { _all: 0 } });
    mockReviewCount.mockResolvedValue(0);
    mockReviewFindMany.mockResolvedValue([]);

    const response = await request(app).get('/v1/movie/details/1/enriched');
    expect(response.status).toBe(200);
    expect(response.body.data.community).toEqual({
      averageScore: null,
      ratingCount: 0,
      reviewCount: 0,
      recentReviews: [],
    });
  });

  // Sad path — TMDB 404 propagates
  it('propagates TMDB 404 without hitting the database', async () => {
    mockFetch.mockResolvedValue(tmdbResponse({ message: 'not found' }, { ok: false, status: 404 }));
    const response = await request(app).get('/v1/movie/details/9999999/enriched');
    expect(response.status).toBe(404);
    expect(mockRatingAggregate).not.toHaveBeenCalled();
  });

  // Sad path — bad id
  it('returns 400 when id is not a positive integer', async () => {
    const response = await request(app).get('/v1/movie/details/abc/enriched');
    expect(response.status).toBe(400);
  });
});

describe('GET /v1/tv/details/:id/enriched', () => {
  it('returns 200 with combined tmdb + community payload', async () => {
    mockFetch.mockResolvedValue(
      tmdbResponse({
        id: 1399,
        name: 'GoT',
        overview: 'syn',
        first_air_date: '2011-04-17',
        poster_path: '/g.jpg',
      })
    );
    mockRatingAggregate.mockResolvedValue({ _avg: { score: 9.1 }, _count: { _all: 7 } });
    mockReviewCount.mockResolvedValue(2);
    mockReviewFindMany.mockResolvedValue([]);

    const response = await request(app).get('/v1/tv/details/1399/enriched');
    expect(response.status).toBe(200);
    expect(response.body.data.tmdb).toMatchObject({ id: 1399, title: 'GoT' });
    expect(response.body.data.community.ratingCount).toBe(7);
  });
});
