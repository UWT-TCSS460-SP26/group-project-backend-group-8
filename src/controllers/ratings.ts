import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { Prisma } from '@/generated/prisma/client';
import { GetRatingsQuery } from '@/middleware/validation';
import { resolveLocalUser } from '@/auth/resolveLocalUser';

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
