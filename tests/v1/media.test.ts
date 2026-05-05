import request from 'supertest';
import { app } from '../../src/app';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockTmdbResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
});

const mockPrismaFindMany = jest.fn();
const mockPrismaAggregate = jest.fn();
const mockPrismaCount = jest.fn();

jest.mock('@/prisma', () => ({
  prisma: {
    review: {
      findMany: (...args: unknown[]) => mockPrismaFindMany(...args),
      count: (...args: unknown[]) => mockPrismaCount(...args),
    },
    rating: {
      aggregate: (...args: unknown[]) => mockPrismaAggregate(...args),
    },
  },
}));

beforeEach(() => {
  mockFetch.mockReset();
  mockPrismaFindMany.mockReset();
  mockPrismaAggregate.mockReset();
  mockPrismaCount.mockReset();
  process.env.TMDB_API_KEY = 'test-api-key';
});

describe('GET /v1/media/:id', () => {
  it('returns media details along with community data', async () => {
    mockFetch.mockResolvedValue(mockTmdbResponse({ title: 'A Movie' }));
    mockPrismaFindMany.mockResolvedValue([{ id: 1, title: 'Review 1' }]);
    mockPrismaCount.mockResolvedValue(1);
    mockPrismaAggregate.mockResolvedValue({ _avg: { score: 8.5 }, _count: { score: 10 } });

    const response = await request(app).get('/v1/media/550').query({ type: 'movie' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      title: 'A Movie',
      community: {
        avgScore: 8.5,
        totalRatings: 10,
        reviews: {
          data: [{ id: 1, title: 'Review 1' }],
          page: 1,
          limit: 25,
          total: 1,
        },
      },
    });
  });

  it('returns 400 when id is invalid', async () => {
    const response = await request(app).get('/v1/media/abc').query({ type: 'movie' });
    expect(response.status).toBe(400);
  });

  it('returns 404 when TMDB fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    mockPrismaFindMany.mockResolvedValue([]);
    mockPrismaCount.mockResolvedValue(0);
    mockPrismaAggregate.mockResolvedValue({ _avg: { score: null }, _count: { score: 0 } });

    const response = await request(app).get('/v1/media/550').query({ type: 'movie' });
    expect(response.status).toBe(404);
  });

  it('handles server errors', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));
    const response = await request(app).get('/v1/media/550').query({ type: 'movie' });
    expect(response.status).toBe(500);
  });
});
