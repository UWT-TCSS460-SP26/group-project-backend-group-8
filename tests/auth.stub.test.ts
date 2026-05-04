import request from 'supertest';

const mockReviewFindUnique = jest.fn();
const mockReviewDelete = jest.fn();
jest.mock('@/prisma', () => ({
  prisma: {
    review: {
      findUnique: (...args: unknown[]) => mockReviewFindUnique(...args),
      delete: (...args: unknown[]) => mockReviewDelete(...args),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 99,
        username: 'tester',
        subjectId: 'sub-x',
        email: 'sub-x@test.local',
      }),
      upsert: jest.fn().mockResolvedValue({
        id: 99,
        username: 'tester',
        subjectId: 'sub-x',
        email: 'sub-x@test.local',
      }),
      update: jest.fn().mockResolvedValue({
        id: 99,
        username: 'tester',
        subjectId: 'sub-x',
        email: 'sub-x@test.local',
      }),
    },
  },
}));

import { app } from '../src/app';

beforeEach(() => {
  mockReviewFindUnique.mockReset();
  mockReviewDelete.mockReset();
});

const stubUser = (role: string, sub = 'sub-x') =>
  JSON.stringify({ sub, role, email: `${sub}@test.local` });

describe('Auth stub middleware (DELETE /v1/reviews/:id, role-gated)', () => {
  // Happy path — Admin can delete any review (PascalCase role on token)
  it('lets an Admin delete someone else’s review', async () => {
    mockReviewFindUnique.mockResolvedValue({ userId: 7 });
    mockReviewDelete.mockResolvedValue({});

    const response = await request(app)
      .delete('/v1/reviews/42')
      .set('X-Test-User', stubUser('Admin'));

    expect(response.status).toBe(200);
    expect(mockReviewDelete).toHaveBeenCalledWith({ where: { id: 42 } });
  });

  // Sad path — User role can't delete someone else's review
  it('returns 403 when a User tries to delete a review they don’t own', async () => {
    mockReviewFindUnique.mockResolvedValue({ userId: 7 });
    const response = await request(app)
      .delete('/v1/reviews/42')
      .set('X-Test-User', stubUser('User'));
    expect(response.status).toBe(403);
    expect(mockReviewDelete).not.toHaveBeenCalled();
  });

  // Sad path — missing stub header → 401
  it('returns 401 when no auth header is provided', async () => {
    const response = await request(app).delete('/v1/reviews/42');
    expect(response.status).toBe(401);
  });

  // Sad path — malformed stub header → 401
  it('returns 401 when the stub header is not valid JSON', async () => {
    const response = await request(app).delete('/v1/reviews/42').set('X-Test-User', 'not-json');
    expect(response.status).toBe(401);
  });

  // Hierarchy — SuperAdmin (above Admin) also passes the at-least-Admin gate
  it('lets a SuperAdmin delete via the role hierarchy', async () => {
    mockReviewFindUnique.mockResolvedValue({ userId: 7 });
    mockReviewDelete.mockResolvedValue({});
    const response = await request(app)
      .delete('/v1/reviews/42')
      .set('X-Test-User', stubUser('SuperAdmin'));
    expect(response.status).toBe(200);
  });
});
