import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { Prisma } from '@/generated/prisma/client';
import { GetRatingsQuery, GetMyListQuery } from '@/middleware/validation';
import { resolveLocalUser } from '@/auth/resolveLocalUser';
import { authorUserSelect, toAuthor, type AuthorUser } from '@/utils/author';

type RatingWithUser = {
  id: number;
  userId: number | null;
  mediaId: number;
  mediaType: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  user?: AuthorUser | null;
};

const withAuthor = (rating: RatingWithUser) => {
  const { user, ...rest } = rating;
  return { ...rest, author: toAuthor(user) };
};

const ratingInclude = { user: { select: authorUserSelect } } as const;

/**
 * Public — aggregate rating summary for a TMDB title.
 * No auth required. `average` is null when no ratings exist (rather than 0,
 * which would be misleading for a 1..10 scale).
 */
export const getRatingsSummary = async (_request: Request, response: Response) => {
  const { mediaId, mediaType } = response.locals.query as GetRatingsQuery;
  const where = { mediaId, mediaType };

  try {
    const aggregate = await prisma.rating.aggregate({
      where,
      _avg: { score: true },
      _count: { _all: true },
    });

    response.status(200).json({
      data: {
        mediaId,
        mediaType,
        average: aggregate._avg.score,
        count: aggregate._count._all,
      },
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve rating summary' });
  }
};

/**
 * Public — get rating by id
 * No auth required.
 */
export const getRatingById = async (request: Request, response: Response) => {
  const id = Number(request.params.id);

  try {
    const rating = await prisma.rating.findUnique({
      where: { id },
      include: ratingInclude,
    });

    if (!rating) {
      response.status(404).json({ error: 'Rating not found' });
      return;
    }

    response.status(200).json({ data: withAuthor(rating as RatingWithUser) });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve rating' });
  }
};

/**
 * GET /v1/ratings/me
 * Story 5 — authenticated user lists their own ratings. Caller identity is
 * the JWT `sub` claim; any client-supplied userId is ignored.
 */
export const getMyRatings = async (request: Request, response: Response) => {
  const { page, limit, sort, order } = response.locals.query as GetMyListQuery;

  try {
    const user = await resolveLocalUser(request);
    const where = { userId: user.id };

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: ratingInclude,
      }),
      prisma.rating.count({ where }),
    ]);

    response.status(200).json({
      data: ratings.map((r) => withAuthor(r as RatingWithUser)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve ratings' });
  }
};

export const postRating = async (request: Request, response: Response) => {
  const { mediaId, mediaType, score } = request.body;
  const user = await resolveLocalUser(request);
  const userId = user.id;

  try {
    const rating = await prisma.rating.create({
      data: {
        score: Number(score),
        mediaId,
        mediaType,
        userId,
      },
      include: ratingInclude,
    });
    response.status(201).json({ data: withAuthor(rating as RatingWithUser) });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        response.status(400).json({ error: 'User not found' });
        return;
      }
      if (error.code === 'P2002') {
        response.status(409).json({ error: 'User has already rated this title' });
        return;
      }
    }
    response.status(500).json({ error: 'Failed to post rating' });
  }
};

export const updateRating = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { score } = request.body;
  const user = await resolveLocalUser(request);
  const userId = user.id;

  try {
    const rating = await prisma.rating.findUnique({ where: { id }, select: { userId: true } });

    if (!rating) {
      return response.status(404).json({ error: 'Rating not found' });
    }

    if (rating.userId !== userId) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    const updatedRating = await prisma.rating.update({
      where: { id },
      data: { score },
      include: ratingInclude,
    });

    response.status(200).json({ data: withAuthor(updatedRating as RatingWithUser) });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to update rating' });
  }
};

export const deleteRating = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const user = await resolveLocalUser(request);
  const userId = user.id;

  try {
    const rating = await prisma.rating.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!rating) {
      return response.status(404).json({ error: 'Rating not found' });
    }

    if (rating.userId !== userId) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    await prisma.rating.delete({ where: { id } });

    response.status(200).json({ message: 'Successfully deleted' });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to delete rating' });
  }
};
