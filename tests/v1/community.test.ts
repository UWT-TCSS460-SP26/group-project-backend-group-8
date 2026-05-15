import request from 'supertest';
import { app } from '../../src/app';
import { clearCache } from '../../src/controllers/community';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockPrismaGroupBy = jest.fn();

jest.mock('@/prisma', () => ({
  prisma: {
    rating: {
      groupBy: (...args: unknown[]) => mockPrismaGroupBy(...args),
    },
  },
}));

const tmdbMovie = (id: number, title: string) => ({
  ok: true,
  status: 200,
  json: async () => ({
    id,
    title,
    overview: 'A synopsis',
    poster_path: '/img.jpg',
    release_date: '2000-01-01',
  }),
});

const tmdbTv = (id: number, title: string) => ({
  ok: true,
  status: 200,
  json: async () => ({
    id,
    name: title,
    overview: 'A synopsis',
    poster_path: '/img.jpg',
    first_air_date: '2000-01-01',
  }),
});

beforeEach(() => {
  mockFetch.mockReset();
  mockPrismaGroupBy.mockReset();
  clearCache();
  process.env.TMDB_API_KEY = 'test-key';
});

describe('GET /v1/community/top-rated/movie', () => {
  it('returns top-rated movies enriched with TMDB metadata', async () => {
    mockPrismaGroupBy.mockResolvedValue([
      { mediaId: 550, mediaType: 'movie', _avg: { score: 9.0 }, _count: { score: 5 } },
    ]);
    mockFetch.mockResolvedValueOnce(tmdbMovie(550, 'Fight Club'));

    const response = await request(app).get('/v1/community/top-rated/movie');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].avgScore).toBe(9.0);
    expect(response.body.data[0].ratingCount).toBe(5);
    expect(response.body.data[0].summary.title).toBe('Fight Club');
    expect(response.body.cached).toBe(false);
    expect(response.body.cacheTtlSeconds).toBe(300);
  });

  it('returns summary: null when TMDB fetch fails for an item', async () => {
    mockPrismaGroupBy.mockResolvedValue([
      { mediaId: 999, mediaType: 'movie', _avg: { score: 8.0 }, _count: { score: 3 } },
    ]);
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const response = await request(app).get('/v1/community/top-rated/movie');

    expect(response.status).toBe(200);
    expect(response.body.data[0].summary).toBeNull();
  });

  it('serves subsequent requests from cache', async () => {
    mockPrismaGroupBy.mockResolvedValue([
      { mediaId: 550, mediaType: 'movie', _avg: { score: 9.0 }, _count: { score: 5 } },
    ]);
    mockFetch.mockResolvedValue(tmdbMovie(550, 'Fight Club'));

    // First request — populates cache
    await request(app).get('/v1/community/top-rated/movie');

    // Second request — should come from cache, no new DB/TMDB calls
    const response = await request(app).get('/v1/community/top-rated/movie');

    expect(response.status).toBe(200);
    expect(response.body.cached).toBe(true);
    expect(mockPrismaGroupBy).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('respects limit query param', async () => {
    mockPrismaGroupBy.mockResolvedValue([]);

    const response = await request(app).get('/v1/community/top-rated/movie').query({ limit: '5' });

    expect(response.status).toBe(200);
    expect(mockPrismaGroupBy).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
  });

  it('handles database errors', async () => {
    mockPrismaGroupBy.mockRejectedValue(new Error('db error'));

    const response = await request(app).get('/v1/community/top-rated/movie');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to retrieve top-rated content');
  });
});

describe('GET /v1/community/top-rated/tv', () => {
  it('returns top-rated tv series enriched with TMDB metadata', async () => {
    mockPrismaGroupBy.mockResolvedValue([
      { mediaId: 1396, mediaType: 'tv', _avg: { score: 8.5 }, _count: { score: 4 } },
    ]);
    mockFetch.mockResolvedValueOnce(tmdbTv(1396, 'Breaking Bad'));

    const response = await request(app).get('/v1/community/top-rated/tv');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].avgScore).toBe(8.5);
    expect(response.body.data[0].ratingCount).toBe(4);
    expect(response.body.data[0].summary.title).toBe('Breaking Bad');
    expect(response.body.cached).toBe(false);
    expect(response.body.cacheTtlSeconds).toBe(300);
  });

  it('returns summary: null when TMDB fetch fails for an item', async () => {
    mockPrismaGroupBy.mockResolvedValue([
      { mediaId: 999, mediaType: 'tv', _avg: { score: 8.0 }, _count: { score: 3 } },
    ]);
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const response = await request(app).get('/v1/community/top-rated/tv');

    expect(response.status).toBe(200);
    expect(response.body.data[0].summary).toBeNull();
  });

  it('serves subsequent requests from cache', async () => {
    mockPrismaGroupBy.mockResolvedValue([
      { mediaId: 1396, mediaType: 'tv', _avg: { score: 8.5 }, _count: { score: 4 } },
    ]);
    mockFetch.mockResolvedValue(tmdbTv(1396, 'Breaking Bad'));

    // First request — populates cache
    await request(app).get('/v1/community/top-rated/tv');

    // Second request — should come from cache, no new DB/TMDB calls
    const response = await request(app).get('/v1/community/top-rated/tv');

    expect(response.status).toBe(200);
    expect(response.body.cached).toBe(true);
    expect(mockPrismaGroupBy).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('respects limit query param', async () => {
    mockPrismaGroupBy.mockResolvedValue([]);

    const response = await request(app).get('/v1/community/top-rated/tv').query({ limit: '5' });

    expect(response.status).toBe(200);
    expect(mockPrismaGroupBy).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
  });

  it('handles database errors', async () => {
    mockPrismaGroupBy.mockRejectedValue(new Error('db error'));

    const response = await request(app).get('/v1/community/top-rated/tv');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to retrieve top-rated content');
  });
});
