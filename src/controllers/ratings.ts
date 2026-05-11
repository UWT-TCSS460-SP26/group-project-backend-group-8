import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { Prisma } from '@/generated/prisma/client';
import { GetRatingsQuery, GetMyRatingsQuery } from '@/middleware/validation';
import { resolveLocalUser } from '@/auth/resolveLocalUser';
import { fetchTmdbItemDetails } from '@/utils/tmdb';

/**
 * Auth required — the calling user's full rating history, each row enriched
 * with TMDB metadata fetched in parallel. If TMDB is unavailable for an
 * individual item, that item's `tmdb` field is null rather than failing the
 * whole request.
 */
export const getMyRatings = async (request: Request, response: Response) => {
  const { page, limit, sort, order } = response.locals.query as GetMyRatingsQuery;

  try {
    const user = await resolveLocalUser(request);

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { userId: user.id },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rating.count({ where: { userId: user.id } }),
    ]);

    const enriched = await Promise.all(
      ratings.map(async (rating) => {
        const tmdb = await fetchTmdbItemDetails(rating.mediaId, rating.mediaType as 'movie' | 'tv');
        return { ...rating, tmdb };
      })
    );

    response.status(200).json({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve ratings history' });
  }
};

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
    const rating = await prisma.rating.findUnique({ where: { id } });

    if (!rating) {
      response.status(404).json({ error: 'Rating not found' });
      return;
    }

    response.status(200).json({ data: rating });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve rating' });
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
    });
    response.status(201).json({ data: rating });
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
    });

    response.status(200).json({ data: updatedRating });
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
