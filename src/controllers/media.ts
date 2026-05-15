import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { MediaType } from '@/generated/prisma';
import type { GetMediaQuery } from '@/middleware/validation';
import { authorUserSelect, toAuthor, type AuthorUser } from '@/utils/author';
import { fetchMovieDetails, fetchTvDetails } from '@/utils/tmdb';

/**
 * GET /v1/media/:id
 *
 * Returns TMDB details for a movie or TV show alongside community reviews and
 * an aggregated rating so a visitor can decide whether it's worth watching.
 *
 * Query params (validated upstream by validateGetMediaQuery):
 *   type   — "movie" | "tv"    (required)
 *   page   — page of reviews   (default 1)
 *   limit  — reviews per page  (default 25, max 100)
 *   sort   — "createdAt" | "id"
 *   order  — "asc" | "desc"
 */
export const getMediaDetails = async (
  request: Request<{ id: string }>,
  response: Response
): Promise<void> => {
  const rawId = Number(request.params.id);
  if (!Number.isInteger(rawId) || rawId <= 0) {
    response.status(400).json({ error: 'Parameter "id" must be a positive integer' });
    return;
  }

  const { type, page, limit, sort, order } = response.locals.query as GetMediaQuery;
  const mediaType = type === 'movie' ? MediaType.movie : MediaType.tv;

  try {
    // ── Run TMDB fetch + DB queries in parallel ──────────────────────────────
    const [tmdbDetails, reviews, ratingAgg] = await Promise.all([
      type === 'movie' ? fetchMovieDetails(rawId) : fetchTvDetails(rawId),

      prisma.review.findMany({
        where: { mediaId: rawId, mediaType },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          title: true,
          body: true,
          createdAt: true,
          user: { select: authorUserSelect },
        },
      }),

      prisma.rating.aggregate({
        where: { mediaId: rawId, mediaType },
        _avg: { score: true },
        _count: { score: true },
      }),
    ]);

    if (!tmdbDetails) {
      response.status(404).json({ error: 'Title not found' });
      return;
    }

    const avgScore =
      ratingAgg._avg.score !== null ? Math.round(ratingAgg._avg.score * 10) / 10 : null;

    const totalReviews = await prisma.review.count({
      where: { mediaId: rawId, mediaType },
    });

    response.json({
      data: {
        mediaId: rawId,
        avgScore,
        ratingCount: ratingAgg._count.score,
        summary: { ...tmdbDetails },
        reviews: {
          data: reviews.map(({ user, ...rest }) => ({
            ...rest,
            author: toAuthor(user as AuthorUser | null),
          })),
          pagination: {
            page,
            limit,
            total: totalReviews,
            totalPages: Math.ceil(totalReviews / limit),
          },
        },
      },
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to fetch details' });
  }
};
