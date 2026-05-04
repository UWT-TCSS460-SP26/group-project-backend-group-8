/**
 * tests/__mocks__/requireAuth.ts  (Story 1 — Caleb)
 *
 * Manual Jest mock for @/middleware/requireAuth.
 * Dropped in tests/__mocks__ so it's co-located with the test suite.
 *
 * Wire it up in jest.config.ts / jest.config.js:
 *
 *   moduleNameMapper: {
 *     '^@/middleware/requireAuth$': '<rootDir>/tests/__mocks__/requireAuth.ts',
 *   }
 *
 * Then in any test file:
 *
 *   import { setMockUser } from '../__mocks__/requireAuth';
 *
 *   beforeEach(() => setMockUser({ sub: 'u1', email: 'a@b.com', role: 'User' }));
 *   afterEach(() => setMockUser(null));
 *
 * Route handlers that call requireRole / requireRoleAtLeast still work —
 * they read req.user which the mock populates exactly like the real middleware.
 * The JWKS fetch never fires.
 */

import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import {
  ROLE_HIERARCHY,
  type Role,
  type AuthenticatedUser,
} from '../../src/middleware/requireAuth';

export { ROLE_HIERARCHY };
export type { Role, AuthenticatedUser };

let _mockUser: AuthenticatedUser | null = null;

/** Set who is "logged in" for the current test. Pass null to simulate unauthenticated. */
export const setMockUser = (user: AuthenticatedUser | null): void => {
  _mockUser = user;
};

const mockAuthMiddleware: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  if (_mockUser) req.user = _mockUser;
  next();
};

export const requireAuth: Array<RequestHandler | ErrorRequestHandler> = [mockAuthMiddleware];

export const requireRole =
  (role: Role): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };

export const requireRoleAtLeast =
  (minRole: Role): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const userIdx = ROLE_HIERARCHY.indexOf(req.user.role);
    const minIdx = ROLE_HIERARCHY.indexOf(minRole);
    if (userIdx < 0 || userIdx < minIdx) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };

export const hasRoleAtLeast = (role: Role | undefined, minRole: Role): boolean => {
  if (!role) return false;
  return ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(minRole);
};
