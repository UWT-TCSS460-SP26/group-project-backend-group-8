import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { $Enums, Prisma } from '@/generated/prisma/client';
import { PostReviewBody, GetReviewsQuery } from '@/middleware/validation';
import Role = $Enums.Role;

/**
 * Public — list reviews for a TMDB title with pagination and sorting.
 * No auth required. Returns 200 with an empty array (not 404) when no
 * reviews exist for the title.
 */
export const getReviews = async (_request: Request, response: Response) => {
  const { mediaId, mediaType, page, limit, sort, order } = response.locals.query as GetReviewsQuery;
  const where = { mediaId, mediaType };

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: { user: { select: { id: true, username: true } } },
      }),
      prisma.review.count({ where }),
    ]);

    response.status(200).json({
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve reviews' });
  }
};

/**
 * POST /v1/reviews
 * Auth required. Creates a review for a movie or TV show.
 * A user may post multiple reviews for the same title (no unique constraint on reviews).
 */
export const createReview = async (request: Request, response: Response) => {
  const { mediaId, mediaType, title, body } = request.body as PostReviewBody;
  const { sub } = request.user!;
  const userId = Number(sub);

  try {
    const review = await prisma.review.create({
      data: {
        userId,
        mediaId,
        mediaType,
        title,
        body,
      },
    });

    response.status(201).json({ data: review });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        response.status(404).json({ error: 'User not found' });
        return;
      }
    }
    response.status(500).json({ error: 'Failed to create review' });
  }
};

export const updateReview = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { body } = request.body;
  const { sub } = request.user!;
  const userId = Number(sub);

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (review!.userId !== userId) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { body },
    });

    response.status(200).json({ data: updatedReview });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        response.status(400).json({ error: 'Rating not found' });
        return;
      }
    }
    response.status(500).json({ error: 'Failed to update review' });
  }
};

export const deleteReview = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { sub, role } = request.user!;
  const userId = Number(sub);

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (role === Role.USER && review!.userId !== userId) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    await prisma.review.delete({ where: { id } });

    response.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        response.status(400).json({ error: 'Review not found' });
        return;
      }
    }
    response.status(500).json({ error: 'Failed to delete review' });
  }
};
