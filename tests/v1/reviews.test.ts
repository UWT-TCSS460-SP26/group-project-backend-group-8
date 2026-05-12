import request from 'supertest';
import { app } from '../../src/app';
import { setMockUser } from '../__mocks__/requireAuth';
import { Prisma } from '@/generated/prisma/client';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockPrismaFindMany = jest.fn();
const mockPrismaCount = jest.fn();
const mockPrismaFindUnique = jest.fn();
const mockPrismaCreate = jest.fn();
const mockPrismaUpdate = jest.fn();
const mockPrismaDelete = jest.fn();

const mockUserFindUnique = jest.fn();
const mockUserUpsert = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock('@/prisma', () => ({
  prisma: {
    review: {
      findMany: (...args: unknown[]) => mockPrismaFindMany(...args),
      count: (...args: unknown[]) => mockPrismaCount(...args),
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
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
  mockPrismaFindMany.mockReset();
  mockPrismaCount.mockReset();
  mockPrismaFindUnique.mockReset();
  mockPrismaCreate.mockReset();
  mockPrismaUpdate.mockReset();
  mockPrismaDelete.mockReset();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUserFindUnique.mockImplementation((args: any) => {
    if (args.where?.subjectId === 'u2') {
      return Promise.resolve({ id: 'u2', email: 'admin@test.com', username: 'admin' });
    }
    return Promise.resolve({ id: 'u1', email: 'test@test.com', username: 'testuser' });
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUserUpsert.mockImplementation((args: any) =>
    Promise.resolve({ id: args.where.subjectId, username: 'testuser', email: 'test@test.com' })
  );
  mockUserUpdate.mockResolvedValue({ id: 'u1', username: 'testuser', email: 'test@test.com' });

  setMockUser(null);
  process.env.TMDB_API_KEY = 'test-key';
});

describe('GET /v1/reviews', () => {
  it('returns paginated reviews', async () => {
    mockPrismaFindMany.mockResolvedValue([{ id: 1, title: 'Good' }]);
    mockPrismaCount.mockResolvedValue(1);
    const response = await request(app)
      .get('/v1/reviews')
      .query({ mediaId: '123', mediaType: 'movie' });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 1, title: 'Good', author: null }]);
    expect(response.body.pagination).toEqual({ page: 1, limit: 25, total: 1, totalPages: 1 });
  });

  it('handles server errors', async () => {
    mockPrismaFindMany.mockRejectedValue(new Error('error'));
    const response = await request(app)
      .get('/v1/reviews')
      .query({ mediaId: '123', mediaType: 'movie' });
    expect(response.status).toBe(500);
  });
});

describe('GET /v1/reviews/:id', () => {
  it('returns review by id', async () => {
    mockPrismaFindUnique.mockResolvedValue({ id: 1, title: 'Good' });
    const response = await request(app).get('/v1/reviews/1');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 1, title: 'Good', author: null });
  });

  it('returns 404 if not found', async () => {
    mockPrismaFindUnique.mockResolvedValue(null);
    const response = await request(app).get('/v1/reviews/1');
    expect(response.status).toBe(404);
  });

  it('handles server errors', async () => {
    mockPrismaFindUnique.mockRejectedValue(new Error('error'));
    const response = await request(app).get('/v1/reviews/1');
    expect(response.status).toBe(500);
  });
});

describe('POST /v1/reviews', () => {
  it('requires auth', async () => {
    const response = await request(app)
      .post('/v1/reviews')
      .send({ title: 'A', body: 'B', mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(401);
  });

  it('creates review', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaCreate.mockResolvedValue({ id: 1, title: 'A' });
    const response = await request(app)
      .post('/v1/reviews')
      .send({ title: 'A', body: 'B', mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ id: 1, title: 'A', author: null });
  });

  it('returns 404 for P2003 error (user not found)', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2003', clientVersion: '1' })
    );
    const response = await request(app)
      .post('/v1/reviews')
      .send({ title: 'A', body: 'B', mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(404);
  });

  it('returns 409 for P2002 error (already reviewed)', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('', { code: 'P2002', clientVersion: '1' })
    );
    const response = await request(app)
      .post('/v1/reviews')
      .send({ title: 'A', body: 'B', mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(409);
  });

  it('handles other server errors', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaCreate.mockRejectedValue(new Error('error'));
    const response = await request(app)
      .post('/v1/reviews')
      .send({ title: 'A', body: 'B', mediaId: 1, mediaType: 'movie' });
    expect(response.status).toBe(500);
  });
});

describe('PUT /v1/reviews/:id', () => {
  it('updates review if owner', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue({ id: 1, userId: 'u1' });
    mockPrismaUpdate.mockResolvedValue({ id: 1, title: 'New' });
    const response = await request(app).put('/v1/reviews/1').send({ title: 'New', body: 'B' });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 1, title: 'New', author: null });
  });

  it('returns 403 if not owner', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue({ id: 1, userId: 'u2' }); // review owned by u2
    const response = await request(app).put('/v1/reviews/1').send({ title: 'New', body: 'B' });
    expect(response.status).toBe(403);
  });

  it('returns 404 if not found', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue(null);
    const response = await request(app).put('/v1/reviews/1').send({ title: 'New', body: 'B' });
    expect(response.status).toBe(404);
  });

  it('handles server errors', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockRejectedValue(new Error('error'));
    const response = await request(app).put('/v1/reviews/1').send({ title: 'New', body: 'B' });
    expect(response.status).toBe(500);
  });
});

describe('DELETE /v1/reviews/:id', () => {
  it('deletes review if owner', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue({ id: 1, userId: 'u1' });
    mockPrismaDelete.mockResolvedValue({ id: 1 });
    const response = await request(app).delete('/v1/reviews/1');
    expect(response.status).toBe(200);
  });

  it('deletes review if admin', async () => {
    setMockUser({ sub: 'u2', email: 'admin@test.com', role: 'Admin' }); // Admin uses u2
    mockPrismaFindUnique.mockResolvedValue({ id: 1, userId: 'u1' }); // review owned by u1
    mockPrismaDelete.mockResolvedValue({ id: 1 });
    const response = await request(app).delete('/v1/reviews/1');
    expect(response.status).toBe(200);
  });

  it('returns 403 if not owner and not admin', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue({ id: 1, userId: 'u3' }); // review owned by u3
    const response = await request(app).delete('/v1/reviews/1');
    expect(response.status).toBe(403);
  });

  it('returns 404 if not found', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockResolvedValue(null);
    const response = await request(app).delete('/v1/reviews/1');
    expect(response.status).toBe(404);
  });

  it('handles server errors', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindUnique.mockRejectedValue(new Error('error'));
    const response = await request(app).delete('/v1/reviews/1');
    expect(response.status).toBe(500);
  });
});

describe('GET /v1/reviews/me', () => {
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

  it('returns 401 without auth', async () => {
    const response = await request(app).get('/v1/reviews/me');
    expect(response.status).toBe(401);
  });

  it('returns caller-scoped reviews with author embedded', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindMany.mockResolvedValue([
      {
        id: 7,
        title: 'mine',
        mediaId: 550,
        mediaType: 'movie',
        user: { id: 'u1', subjectId: 'u1', username: 'testuser', firstName: null, lastName: null },
      },
    ]);
    mockPrismaCount.mockResolvedValue(1);
    mockFetch.mockResolvedValue(tmdbMovie);

    const response = await request(app).get('/v1/reviews/me');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        id: 7,
        title: 'mine',
        mediaId: 550,
        mediaType: 'movie',
        author: { id: 'u1', subjectId: 'u1', displayName: 'testuser' },
        movieSummary: {
          id: 550,
          title: 'Fight Club',
          synopsis: 'A soap salesman...',
          posterUrl: 'https://image.tmdb.org/t/p/original/abc.jpg',
          releaseDate: '1999-10-15',
        },
      },
    ]);
    // Confirm Prisma was scoped to the resolved local user id, not anything client-supplied.
    expect(mockPrismaFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } })
    );
  });

  it('returns movieSummary: null when TMDB fetch fails for an item', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindMany.mockResolvedValue([
      { id: 1, mediaId: 550, mediaType: 'movie', title: 'mine', user: null },
    ]);
    mockPrismaCount.mockResolvedValue(1);
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    const response = await request(app).get('/v1/reviews/me');
    expect(response.status).toBe(200);
    expect(response.body.data[0].movieSummary).toBeNull();
    expect(response.body.data[0].author).toBeNull();
  });

  it('ignores client-supplied userId query param', async () => {
    setMockUser({ sub: 'u1', email: 'test@test.com', role: 'User' });
    mockPrismaFindMany.mockResolvedValue([]);
    mockPrismaCount.mockResolvedValue(0);
    await request(app).get('/v1/reviews/me').query({ userId: '999' });
    expect(mockPrismaFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } })
    );
  });
});
