import request from 'supertest';
import { app } from '../../src/app';
import { setMockUser } from '../__mocks__/requireAuth';
import { Prisma } from '@/generated/prisma/client';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockPrismaAggregate = jest.fn();
const mockPrismaFindUnique = jest.fn();
const mockPrismaFindMany = jest.fn();
const mockPrismaCount = jest.fn();
const mockPrismaCreate = jest.fn();
const mockPrismaUpdate = jest.fn();
const mockPrismaDelete = jest.fn();
const mockUserUpsert = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock('@/prisma', () => ({
  prisma: {
    rating: {
      aggregate: (...args: unknown[]) => mockPrismaAggregate(...args),
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      findMany: (...args: unknown[]) => mockPrismaFindMany(...args),
      count: (...args: unknown[]) => mockPrismaCount(...args),
      create: (...args: unknown[]) => mockPrismaCreate(...args),
      update: (...args: unknown[]) => mockPrismaUpdate(...args),
      delete: (...args: unknown[]) => mockPrismaDelete(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      upsert: (...args: unknown[]) => mockUserUpsert(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

beforeEach(() => {
  mockFetch.mockReset();
  mockPrismaAggregate.mockReset();
  mockPrismaFindUnique.mockReset();
  mockPrismaFindMany.mockReset();
  mockPrismaCount.mockReset();
  mockPrismaCreate.mockReset();
  mockPrismaUpdate.mockReset();
  mockPrismaDelete.mockReset();
  mockUserUpsert.mockReset();
  mockUserFindUnique.mockReset();
  mockUserUpdate.mockReset();

  mockUserFindUnique.mockResolvedValue({ id: 'u1', email: 'test@test.com' });
  mockUserUpdate.mockResolvedValue({ id: 'u1', email: 'test@test.com' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUserUpsert.mockImplementation((args: any) => Promise.resolve({ id: args.where.subjectId }));
  setMockUser(null);
  process.env.TMDB_API_KEY = 'test-key';
});

describe('GET /v1/ratings', () => {
  it('returns rating summary', async () => {
    mockPrismaAggregate.mockResolvedValue({
      _avg: { score: 8 },
      _count: { _all: 5 },
    });
    const response = await request(app)
      .get('/v1/ratings')
      .query({ mediaId: '123', mediaType: 'movie' });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      mediaId: 123,
      mediaType: 'movie',
      average: 8,
      count: 5,
    });
  });

  it('handles server errors', async () => {
    mockPrismaAggregate.mockRejectedValue(new Error('error'));
    const response = await request(app)
      .get('/v1/ratings')
      .query({ mediaId: '123', mediaType: 'movie' });
    expect(response.status).toBe(500);
  });
});

describe('GET /v1/ratings/:id', () => {
  it('returns rating by id', async () => {
    mockPrismaFindUnique.mockResolvedValue({ id: 1, score: 9 });
    const response = await request(app).get('/v1/ratings/1');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 1, score: 9, author: null });
  });

  it('returns 404 if not found', async () => {
    mockPrismaFindUnique.mockResolvedValue(null);
    const response = await request(app).get('/v1/ratings/1');
    expect(response.status).toBe(404);
  });

  it('handles server errors', async () => {
    mockPrismaFindUnique.mockRejectedValue(new Error('error'));
    const response = await request(app).get('/v1/ratings/1');
    expect(response.status).toBe(500);
  });
});

describe('POST /v1/ratings', () => {
  it('requires auth', async () => {
    const response = await request(app)
      .post('/v1/ratings')
      .send({ score: 8, mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(401);
  });

  it('creates rating', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaCreate.mockResolvedValue({ id: 1, score: 8 });
    const response = await request(app)
      .post('/v1/ratings')
      .send({ score: 8, mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ id: 1, score: 8, author: null });
  });

  it('returns 400 for P2003 error (user not found)', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2003', clientVersion: '1' })
    );
    const response = await request(app)
      .post('/v1/ratings')
      .send({ score: 8, mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(400);
  });

  it('returns 409 for P2002 error (already rated)', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2002', clientVersion: '1' })
    );
    const response = await request(app)
      .post('/v1/ratings')
      .send({ score: 8, mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(409);
  });

  it('handles other server errors', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaCreate.mockRejectedValue(new Error('error'));
    const response = await request(app)
      .post('/v1/ratings')
      .send({ score: 8, mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(500);
  });
});

describe('PUT /v1/ratings/:id', () => {
  it('updates rating if owner', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue({ id: 1, userId: 'u1' });
    mockPrismaUpdate.mockResolvedValue({ id: 1, score: 9 });
    const response = await request(app).put('/v1/ratings/1').send({ score: 9 });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 1, score: 9, author: null });
  });

  it('returns 403 if not owner', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue({ id: 1, userId: 'u2' });
    const response = await request(app).put('/v1/ratings/1').send({ score: 9 });
    expect(response.status).toBe(403);
  });

  it('returns 404 if not found', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue(null);
    const response = await request(app).put('/v1/ratings/1').send({ score: 9 });
    expect(response.status).toBe(404);
  });

  it('handles server errors', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockRejectedValue(new Error('error'));
    const response = await request(app).put('/v1/ratings/1').send({ score: 9 });
    expect(response.status).toBe(500);
  });
});

describe('DELETE /v1/ratings/:id', () => {
  it('deletes rating if owner', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue({ id: 1, userId: 'u1' });
    mockPrismaDelete.mockResolvedValue({ id: 1 });
    const response = await request(app).delete('/v1/ratings/1');
    expect(response.status).toBe(200);
  });

  it('returns 403 if not owner', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue({ id: 1, userId: 'u2' });
    const response = await request(app).delete('/v1/ratings/1');
    expect(response.status).toBe(403);
  });

  it('returns 404 if not found', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue(null);
    const response = await request(app).delete('/v1/ratings/1');
    expect(response.status).toBe(404);
  });

  it('handles server errors', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockRejectedValue(new Error('error'));
    const response = await request(app).delete('/v1/ratings/1');
    expect(response.status).toBe(500);
  });
});

describe('GET /v1/ratings/me', () => {
  const tmdbMovie = {
    ok: true,
    status: 200,
    json: async () => ({
      id: 550,
      title: 'Fight Club',
      overview: 'A soap salesman...',
      poster_path: '/abc.jpg',
      release_date: '1999-10-15',
    }),
  };

  it('requires auth', async () => {
    const response = await request(app).get('/v1/ratings/me');
    expect(response.status).toBe(401);
  });

  it('returns enriched ratings with TMDB metadata and author', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindMany.mockResolvedValue([
      { id: 1, mediaId: 550, mediaType: 'movie', score: 8.5, user: null },
    ]);
    mockPrismaCount.mockResolvedValue(1);
    mockFetch.mockResolvedValue(tmdbMovie);

    const response = await request(app).get('/v1/ratings/me');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].movieSummary.title).toBe('Fight Club');
    expect(response.body.data[0].author).toBeNull();
    expect(response.body.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('returns movieSummary: null when TMDB fetch fails for an item', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindMany.mockResolvedValue([
      { id: 1, mediaId: 550, mediaType: 'movie', score: 8.5, user: null },
    ]);
    mockPrismaCount.mockResolvedValue(1);
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const response = await request(app).get('/v1/ratings/me');
    expect(response.status).toBe(200);
    expect(response.body.data[0].movieSummary).toBeNull();
    expect(response.body.data[0].author).toBeNull();
  });

  it('returns caller-scoped ratings with author embedded', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindMany.mockResolvedValue([
      {
        id: 3,
        mediaId: 550,
        mediaType: 'movie',
        score: 9,
        user: { id: 'u1', subjectId: 'u1', username: 'testuser', firstName: null, lastName: null },
      },
    ]);
    mockPrismaCount.mockResolvedValue(1);
    // TMDB unavailable — movieSummary: null in response
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    const response = await request(app).get('/v1/ratings/me');
    expect(response.status).toBe(200);
    expect(response.body.data[0].author).toEqual({
      id: 'u1',
      subjectId: 'u1',
      displayName: 'testuser',
    });
    expect(response.body.data[0].movieSummary).toBeNull();
  });

  it('ignores client-supplied userId query param', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindMany.mockResolvedValue([]);
    mockPrismaCount.mockResolvedValue(0);

    await request(app).get('/v1/ratings/me').query({ userId: '999' });
    expect(mockPrismaFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } })
    );
  });

  it('handles database errors', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindMany.mockRejectedValue(new Error('db error'));

    const response = await request(app).get('/v1/ratings/me');
    expect(response.status).toBe(500);
  });

  it('respects limit and page query params', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindMany.mockResolvedValue([]);
    mockPrismaCount.mockResolvedValue(0);

    const response = await request(app).get('/v1/ratings/me').query({ limit: '5', page: '2' });
    expect(response.status).toBe(200);
    expect(response.body.pagination.limit).toBe(5);
    expect(response.body.pagination.page).toBe(2);
  });
});
