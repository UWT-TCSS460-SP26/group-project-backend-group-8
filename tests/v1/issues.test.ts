import request from 'supertest';
import { setMockUser } from '../__mocks__/requireAuth';

const mockIssueCreate = jest.fn();
const mockIssueFindMany = jest.fn();
const mockIssueFindUnique = jest.fn();
const mockIssueUpdate = jest.fn();
const mockIssueDelete = jest.fn();
const mockIssueCount = jest.fn();
const mockTransaction = jest.fn();

jest.mock('@/prisma', () => ({
  prisma: {
    issue: {
      create: (...args: unknown[]) => mockIssueCreate(...args),
      findMany: (...args: unknown[]) => mockIssueFindMany(...args),
      findUnique: (...args: unknown[]) => mockIssueFindUnique(...args),
      update: (...args: unknown[]) => mockIssueUpdate(...args),
      delete: (...args: unknown[]) => mockIssueDelete(...args),
      count: (...args: unknown[]) => mockIssueCount(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { app } from '../../src/app';

beforeEach(() => {
  mockIssueCreate.mockReset();
  mockIssueFindMany.mockReset();
  mockIssueFindUnique.mockReset();
  mockIssueUpdate.mockReset();
  mockIssueDelete.mockReset();
  mockIssueCount.mockReset();
  mockTransaction.mockReset();
  setMockUser(null);
});

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const baseIssue = {
  id: 1,
  title: 'Search returns 500',
  description: 'Hitting /search 500s.',
  reproSteps: null,
  reporterEmail: null,
  reporterUserId: null,
  status: 'open',
  createdAt: new Date('2026-05-03T00:00:00Z'),
  updatedAt: new Date('2026-05-03T00:00:00Z'),
};

// ─── POST /v1/issues ──────────────────────────────────────────────────────────

describe('POST /v1/issues', () => {
  it('creates an issue with title and description', async () => {
    mockIssueCreate.mockResolvedValue(baseIssue);

    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'Search returns 500', description: 'Hitting /search 500s.' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      id: 1,
      title: 'Search returns 500',
      status: 'open',
    });
    expect(mockIssueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Search returns 500',
        description: 'Hitting /search 500s.',
      }),
    });
  });

  it('accepts optional reproSteps and reporterEmail', async () => {
    mockIssueCreate.mockResolvedValue({ ...baseIssue, id: 2 });

    const response = await request(app).post('/v1/issues').send({
      title: 'Bad poster path',
      description: 'Posters 404.',
      reproSteps: 'Open /v1/movie/details/1',
      reporterEmail: 'qa@example.com',
    });

    expect(response.status).toBe(201);
    expect(mockIssueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reproSteps: 'Open /v1/movie/details/1',
        reporterEmail: 'qa@example.com',
      }),
    });
  });

  it('returns 400 when title is missing', async () => {
    const response = await request(app).post('/v1/issues').send({ description: 'No title.' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeInstanceOf(Array);
    expect(mockIssueCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when description is missing', async () => {
    const response = await request(app).post('/v1/issues').send({ title: 'Hi' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeInstanceOf(Array);
  });

  it('returns 400 when title is whitespace-only', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: '   ', description: 'real desc' });
    expect(response.status).toBe(400);
  });

  it('returns 400 when reporterEmail is malformed', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'x', description: 'y', reporterEmail: 'not-an-email' });
    expect(response.status).toBe(400);
  });

  it('accepts a title exactly 200 chars long', async () => {
    mockIssueCreate.mockResolvedValue({ ...baseIssue, id: 3, title: 'a'.repeat(200) });

    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'a'.repeat(200), description: 'd' });
    expect(response.status).toBe(201);
  });

  it('returns 400 when title exceeds 200 chars', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'a'.repeat(201), description: 'd' });
    expect(response.status).toBe(400);
  });

  it('returns 500 with a safe message when the DB throws', async () => {
    mockIssueCreate.mockRejectedValue(new Error('connection lost'));

    const response = await request(app).post('/v1/issues').send({ title: 'x', description: 'y' });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to file issue');
    expect(JSON.stringify(response.body)).not.toMatch(/connection lost/);
  });

  it('does not require an Authorization header', async () => {
    mockIssueCreate.mockResolvedValue({ ...baseIssue, id: 4 });

    const response = await request(app).post('/v1/issues').send({ title: 't', description: 'd' });
    expect(response.status).toBe(201);
  });
});

// ─── GET /v1/issues ───────────────────────────────────────────────────────────

describe('GET /v1/issues', () => {
  it('returns paginated issues for an admin', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockTransaction.mockResolvedValue([[baseIssue], 1]);

    const response = await request(app).get('/v1/issues');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toEqual({
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
    });
  });

  it('returns 401 with no token', async () => {
    const response = await request(app).get('/v1/issues');
    expect(response.status).toBe(401);
  });

  it('returns 403 for a User-role token', async () => {
    setMockUser({ sub: 'user-1', role: 'USER' });
    const response = await request(app).get('/v1/issues');
    expect(response.status).toBe(403);
  });

  it('returns 403 for a Moderator-role token', async () => {
    setMockUser({ sub: 'mod-1', role: 'MODERATOR' });
    const response = await request(app).get('/v1/issues');
    expect(response.status).toBe(403);
  });

  it('allows SuperAdmin', async () => {
    setMockUser({ sub: 'super-1', role: 'SUPER_ADMIN' });
    mockTransaction.mockResolvedValue([[], 0]);

    const response = await request(app).get('/v1/issues');
    expect(response.status).toBe(200);
  });

  it('filters by status=open', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockTransaction.mockResolvedValue([[baseIssue], 1]);

    const response = await request(app).get('/v1/issues?status=open');

    expect(response.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('returns 400 for an invalid status value', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    const response = await request(app).get('/v1/issues?status=banana');
    expect(response.status).toBe(400);
    expect(response.body.error).toBeInstanceOf(Array);
  });

  it('respects page and limit params', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockTransaction.mockResolvedValue([[], 50]);

    const response = await request(app).get('/v1/issues?page=2&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.pagination.totalPages).toBe(5);
  });

  it('returns 400 when limit exceeds 100', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    const response = await request(app).get('/v1/issues?limit=999');
    expect(response.status).toBe(400);
  });

  it('returns 500 with a safe message when the DB throws', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockTransaction.mockRejectedValue(new Error('db exploded'));

    const response = await request(app).get('/v1/issues');
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to retrieve issues');
    expect(JSON.stringify(response.body)).not.toMatch(/db exploded/);
  });
});

// ─── GET /v1/issues/:id ───────────────────────────────────────────────────────

describe('GET /v1/issues/:id', () => {
  it('returns full issue detail for an admin', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockResolvedValue(baseIssue);

    const response = await request(app).get('/v1/issues/1');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 1, title: 'Search returns 500' });
  });

  it('returns 401 with no token', async () => {
    const response = await request(app).get('/v1/issues/1');
    expect(response.status).toBe(401);
  });

  it('returns 403 for a User-role token', async () => {
    setMockUser({ sub: 'user-1', role: 'USER' });
    const response = await request(app).get('/v1/issues/1');
    expect(response.status).toBe(403);
  });

  it('returns 404 for a non-existent issue', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockResolvedValue(null);

    const response = await request(app).get('/v1/issues/99999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Issue not found');
  });

  it('returns 400 for a non-numeric id', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    const response = await request(app).get('/v1/issues/abc');
    expect(response.status).toBe(400);
  });

  it('returns 400 for an id that exceeds postgres int max', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    const response = await request(app).get('/v1/issues/99999999999999999999999999');
    expect(response.status).toBe(400);
    expect(mockIssueFindUnique).not.toHaveBeenCalled();
  });

  it('returns 500 with a safe message when the DB throws', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockRejectedValue(new Error('timeout'));

    const response = await request(app).get('/v1/issues/1');
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to retrieve issue');
    expect(JSON.stringify(response.body)).not.toMatch(/timeout/);
  });
});

// ─── PATCH /v1/issues/:id ────────────────────────────────────────────────────

describe('PATCH /v1/issues/:id', () => {
  it('updates status to in_progress', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockResolvedValue(baseIssue);
    mockIssueUpdate.mockResolvedValue({
      ...baseIssue,
      status: 'in_progress',
      updatedAt: new Date(),
    });

    const response = await request(app).patch('/v1/issues/1').send({ status: 'in_progress' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('in_progress');
  });

  it('accepts all valid status values', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });

    for (const status of ['open', 'in_progress', 'resolved', 'closed']) {
      mockIssueFindUnique.mockResolvedValue(baseIssue);
      mockIssueUpdate.mockResolvedValue({ ...baseIssue, status });

      const response = await request(app).patch('/v1/issues/1').send({ status });
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(status);
    }
  });

  it('returns 400 for an invalid status value', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });

    const response = await request(app).patch('/v1/issues/1').send({ status: 'banana' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeInstanceOf(Array);
    expect(mockIssueUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 for an empty body', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });

    const response = await request(app).patch('/v1/issues/1').send({});

    expect(response.status).toBe(400);
    expect(mockIssueUpdate).not.toHaveBeenCalled();
  });

  it('returns 401 with no token', async () => {
    const response = await request(app).patch('/v1/issues/1').send({ status: 'resolved' });
    expect(response.status).toBe(401);
  });

  it('returns 403 for a User-role token', async () => {
    setMockUser({ sub: 'user-1', role: 'USER' });
    const response = await request(app).patch('/v1/issues/1').send({ status: 'resolved' });
    expect(response.status).toBe(403);
  });

  it('returns 404 for a non-existent issue', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockResolvedValue(null);

    const response = await request(app).patch('/v1/issues/99999').send({ status: 'resolved' });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Issue not found');
  });

  it('returns 400 for a non-numeric id', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    const response = await request(app).patch('/v1/issues/abc').send({ status: 'resolved' });
    expect(response.status).toBe(400);
  });

  it('returns 400 for an id that exceeds postgres int max', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    const response = await request(app)
      .patch('/v1/issues/99999999999999999999999999')
      .send({ status: 'RESOLVED' });
    expect(response.status).toBe(400);
    expect(mockIssueUpdate).not.toHaveBeenCalled();
  });

  it('returns 500 with a safe message when the DB throws', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockResolvedValue(baseIssue);
    mockIssueUpdate.mockRejectedValue(new Error('lock timeout'));

    const response = await request(app).patch('/v1/issues/1').send({ status: 'resolved' });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to update issue');
    expect(JSON.stringify(response.body)).not.toMatch(/lock timeout/);
  });
});

// ─── DELETE /v1/issues/:id ───────────────────────────────────────────────────

describe('DELETE /v1/issues/:id', () => {
  it('deletes an issue and returns 204', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockResolvedValue(baseIssue);
    mockIssueDelete.mockResolvedValue(baseIssue);

    const response = await request(app).delete('/v1/issues/1');

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    expect(mockIssueDelete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('returns 401 with no token', async () => {
    const response = await request(app).delete('/v1/issues/1');
    expect(response.status).toBe(401);
  });

  it('returns 403 for a User-role token', async () => {
    setMockUser({ sub: 'user-1', role: 'USER' });
    const response = await request(app).delete('/v1/issues/1');
    expect(response.status).toBe(403);
  });

  it('returns 403 for a Moderator-role token', async () => {
    setMockUser({ sub: 'mod-1', role: 'MODERATOR' });
    const response = await request(app).delete('/v1/issues/1');
    expect(response.status).toBe(403);
  });

  it('returns 404 for a non-existent issue', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockResolvedValue(null);

    const response = await request(app).delete('/v1/issues/99999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Issue not found');
  });

  it('returns 400 for a non-numeric id', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    const response = await request(app).delete('/v1/issues/abc');
    expect(response.status).toBe(400);
  });

  it('returns 400 for an id that exceeds postgres int max', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    const response = await request(app).delete('/v1/issues/99999999999999999999999999');
    expect(response.status).toBe(400);
    expect(mockIssueDelete).not.toHaveBeenCalled();
  });

  it('does not call delete if the issue does not exist', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockResolvedValue(null);

    await request(app).delete('/v1/issues/99999');
    expect(mockIssueDelete).not.toHaveBeenCalled();
  });

  it('returns 500 with a safe message when the DB throws', async () => {
    setMockUser({ sub: 'admin-1', role: 'ADMIN' });
    mockIssueFindUnique.mockResolvedValue(baseIssue);
    mockIssueDelete.mockRejectedValue(new Error('foreign key violation'));

    const response = await request(app).delete('/v1/issues/1');
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to delete issue');
    expect(JSON.stringify(response.body)).not.toMatch(/foreign key/);
  });
});
