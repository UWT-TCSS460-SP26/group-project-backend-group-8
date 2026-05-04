import request from 'supertest';

const mockIssueCreate = jest.fn();
jest.mock('@/prisma', () => ({
  prisma: {
    issue: { create: (...args: unknown[]) => mockIssueCreate(...args) },
  },
}));

import { app } from '../../src/app';

beforeEach(() => {
  mockIssueCreate.mockReset();
});

describe('POST /v1/issues', () => {
  // Happy path — required fields only
  it('creates an issue with title and description', async () => {
    mockIssueCreate.mockResolvedValue({
      id: 1,
      title: 'Search returns 500',
      status: 'open',
      createdAt: new Date('2026-05-03T00:00:00Z'),
    });
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

  // Happy path — full payload
  it('accepts optional reproSteps and reporterEmail', async () => {
    mockIssueCreate.mockResolvedValue({
      id: 2,
      title: 'Bad poster path',
      status: 'open',
      createdAt: new Date(),
    });
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

  // Sad path — missing title
  it('returns 400 when title is missing', async () => {
    const response = await request(app).post('/v1/issues').send({ description: 'No title.' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(mockIssueCreate).not.toHaveBeenCalled();
  });

  // Sad path — missing description
  it('returns 400 when description is missing', async () => {
    const response = await request(app).post('/v1/issues').send({ title: 'Hi' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  // Sad path — empty title (whitespace)
  it('returns 400 when title is whitespace-only', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: '   ', description: 'real desc' });
    expect(response.status).toBe(400);
  });

  // Sad path — bad email
  it('returns 400 when reporterEmail is malformed', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'x', description: 'y', reporterEmail: 'not-an-email' });
    expect(response.status).toBe(400);
  });

  // Edge — title at the 200-char limit succeeds
  it('accepts a title exactly 200 chars long', async () => {
    mockIssueCreate.mockResolvedValue({
      id: 3,
      title: 'a'.repeat(200),
      status: 'open',
      createdAt: new Date(),
    });
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'a'.repeat(200), description: 'd' });
    expect(response.status).toBe(201);
  });

  // Edge — title past the 200-char limit fails
  it('returns 400 when title exceeds 200 chars', async () => {
    const response = await request(app)
      .post('/v1/issues')
      .send({ title: 'a'.repeat(201), description: 'd' });
    expect(response.status).toBe(400);
  });

  // Sad path — DB failure surfaces a safe error, no stack
  it('returns 500 with a safe message when the DB throws', async () => {
    mockIssueCreate.mockRejectedValue(new Error('connection lost'));
    const response = await request(app).post('/v1/issues').send({ title: 'x', description: 'y' });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to file issue');
    expect(JSON.stringify(response.body)).not.toMatch(/connection lost/);
  });

  // Sanity — no auth header required
  it('does not require an Authorization header', async () => {
    mockIssueCreate.mockResolvedValue({ id: 4, title: 't', status: 'open', createdAt: new Date() });
    const response = await request(app).post('/v1/issues').send({ title: 't', description: 'd' });
    expect(response.status).toBe(201);
  });
});
