/**
 * Story 5 — author identity surface.
 *
 * Every review and rating response includes an `author` object so a partner
 * front-end can render a feed without a separate /users/:id lookup. The
 * stable id is the Auth² `sub` claim (mirrored in `User.subjectId`); the
 * local PK is included for callers that prefer integer keys.
 */

export interface AuthorUser {
  id: number;
  subjectId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
}

export interface Author {
  id: number;
  subjectId: string;
  displayName: string;
}

export const authorUserSelect = {
  id: true,
  subjectId: true,
  username: true,
  firstName: true,
  lastName: true,
} as const;

const FALLBACK_DISPLAY_NAME = 'Unknown User';

export const toAuthor = (user: AuthorUser | null | undefined): Author | null => {
  if (!user) return null;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const displayName = user.username || fullName || FALLBACK_DISPLAY_NAME;
  return { id: user.id, subjectId: user.subjectId, displayName };
};
