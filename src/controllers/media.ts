import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { MediaType } from '@/generated/prisma';
import type { GetMediaQuery } from '@/middleware/validation';

const TMDB_BASE = 'https://api.themoviedb.org/3';

/**
 * Fetch movie or TV details from TMDB.
 * Mirrors the pattern used in movie.proxy / tv.proxy controllers.
 */
const fetchTmdbDetails = async (
  mediaId: number,
  mediaType: 'movie' | 'tv'
): Promise<Record<string, unknown> | null> => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const path = mediaType === 'movie' ? `/movie/${mediaId}` : `/tv/${mediaId}`;
  const url = `${TMDB_BASE}${path}?api_key=${apiKey}&language=en-US`;

  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<Record<string, unknown>>;
};

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
      fetchTmdbDetails(rawId, type),

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
        },
      }),

      prisma.rating.aggregate({
        where: { mediaId: rawId, mediaType },
        _avg: { score: true },
        _count: { score: true },
      }),
    ]);

    if (!tmdbDetails) {
      response.status(404).json({ error: 'Media not found' });
      return;
    }

    const avgScore =
      ratingAgg._avg.score !== null ? Math.round(ratingAgg._avg.score * 10) / 10 : null;

    const totalReviews = await prisma.review.count({
      where: { mediaId: rawId, mediaType },
    });

    response.json({
      ...tmdbDetails,
      community: {
        avgScore,
        totalRatings: ratingAgg._count.score,
        reviews: {
          data: reviews,
          page,
          limit,
          total: totalReviews,
        },
      },
    });
  } catch (error) {
    console.error(`[getMediaDetails] id=${rawId} type=${type}`, error);
    response.status(500).json({ error: 'Failed to fetch media details' });
  }
};
