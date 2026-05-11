import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { Prisma } from '@/generated/prisma/client';
import { PostReviewBody, GetReviewsQuery, GetMyListQuery } from '@/middleware/validation';
import { resolveLocalUser } from '@/auth/resolveLocalUser';
import { hasRoleAtLeast } from '@/middleware/requireAuth';
import { authorUserSelect, toAuthor, type AuthorUser } from '@/utils/author';

type ReviewWithUser = {
  id: number;
  userId: number | null;
  username: string;
  mediaId: number;
  mediaType: string;
  title: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  user?: AuthorUser | null;
};

const withAuthor = (review: ReviewWithUser) => {
  const { user, ...rest } = review;
  return { ...rest, author: toAuthor(user) };
};

const reviewInclude = { user: { select: authorUserSelect } } as const;

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
        include: reviewInclude,
      }),
      prisma.review.count({ where }),
    ]);

    response.status(200).json({
      data: reviews.map((r) => withAuthor(r as ReviewWithUser)),
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
 * Public — get review by id
 * No auth required.
 */
export const getReviewById = async (request: Request, response: Response) => {
  const id = Number(request.params.id);

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: reviewInclude,
    });

    if (!review) {
      response.status(404).json({ error: 'Review not found' });
      return;
    }

    response.status(200).json({ data: withAuthor(review as ReviewWithUser) });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve review' });
  }
};

/**
 * GET /v1/reviews/me
 * Story 5 — authenticated user lists their own reviews. Caller identity is
 * the JWT `sub` claim; any client-supplied userId is ignored.
 */
export const getMyReviews = async (request: Request, response: Response) => {
  const { page, limit, sort, order } = response.locals.query as GetMyListQuery;

  try {
    const user = await resolveLocalUser(request);
    const where = { userId: user.id };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: reviewInclude,
      }),
      prisma.review.count({ where }),
    ]);

    response.status(200).json({
      data: reviews.map((r) => withAuthor(r as ReviewWithUser)),
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

export const createReview = async (request: Request, response: Response) => {
  const { mediaId, mediaType, title, body } = request.body as PostReviewBody;
  const user = await resolveLocalUser(request);
  const userId = user.id;
  const username = user.username;

  try {
    const review = await prisma.review.create({
      data: {
        userId,
        username,
        mediaId,
        mediaType,
        title,
        body,
      },
      include: reviewInclude,
    });

    response.status(201).json({ data: withAuthor(review as ReviewWithUser) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        response.status(404).json({ error: 'User not found' });
        return;
      }
      if (error.code === 'P2002') {
        response.status(409).json({ error: 'User has already reviewed this title' });
        return;
      }
    }
    response.status(500).json({ error: 'Failed to create review' });
  }
};

export const updateReview = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { title, body } = request.body;
  const user = await resolveLocalUser(request);
  const userId = user.id;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!review) {
      return response.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== userId) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    const data: { title?: string; body: string } = { body };
    if (title) {
      data.title = title;
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data,
      include: reviewInclude,
    });

    response.status(200).json({ data: withAuthor(updatedReview as ReviewWithUser) });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to update review' });
  }
};

export const deleteReview = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const user = await resolveLocalUser(request);
  const userId = user.id;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!review) {
      return response.status(404).json({ error: 'Review not found' });
    }

    const isAdmin = hasRoleAtLeast(request.user?.role, 'Admin');
    const isOwner = review.userId === userId;

    if (!isAdmin && !isOwner) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    await prisma.review.delete({ where: { id } });

    response.status(200).json({ message: 'Successfully deleted' });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to delete review' });
  }
};
