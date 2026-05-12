import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { fetchMovieDetails, fetchTvDetails, MovieSummary, TvSeriesSummary } from '@/utils/tmdb';
import type { GetTopRatedQuery } from '@/middleware/validation';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface TopRatedMovieItem {
  mediaId: number;
  avgScore: number;
  ratingCount: number;
  movieSummary: MovieSummary | null;
}

interface TopRatedTvItem {
  mediaId: number;
  avgScore: number;
  ratingCount: number;
  tvSeriesSummary: TvSeriesSummary | null;
}

interface MovieCacheEntry {
  data: TopRatedMovieItem[];
  expiresAt: number;
}

interface TvCacheEntry {
  data: TopRatedTvItem[];
  expiresAt: number;
}

const movieCache = new Map<string, MovieCacheEntry>();
const tvCache = new Map<string, TvCacheEntry>();

const cacheKey = (limit: number, minCount: number) => `${limit}:${minCount}`;

const getMovieCached = (limit: number, minCount: number): TopRatedMovieItem[] | null => {
  const key = cacheKey(limit, minCount);
  const entry = movieCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    movieCache.delete(key);
    return null;
  }
  return entry.data;
};

const setMovieCache = (limit: number, minCount: number, data: TopRatedMovieItem[]): void => {
  movieCache.set(cacheKey(limit, minCount), { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

const getTvCached = (limit: number, minCount: number): TopRatedTvItem[] | null => {
  const key = cacheKey(limit, minCount);
  const entry = tvCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    tvCache.delete(key);
    return null;
  }
  return entry.data;
};

const setTvCache = (limit: number, minCount: number, data: TopRatedTvItem[]): void => {
  tvCache.set(cacheKey(limit, minCount), { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

/** Exposed so tests can reset state between runs. */
export const clearCache = (): void => {
  movieCache.clear();
  tvCache.clear();
};

/**
 * Public — returns top-rated movies by community average score.
 *
 * Results are cached in memory for 5 minutes to limit TMDB API usage.
 * The response includes a `cached` flag and `cacheTtlSeconds` so callers
 * know when to expect fresh data.
 */
export const getTopRatedMovies = async (_request: Request, response: Response): Promise<void> => {
  const { limit, minCount } = response.locals.query as GetTopRatedQuery;

  const cached = getMovieCached(limit, minCount);
  if (cached) {
    response.status(200).json({ data: cached, cached: true, cacheTtlSeconds: CACHE_TTL_MS / 1000 });
    return;
  }

  try {
    const topRated = await prisma.rating.groupBy({
      by: ['mediaId'],
      where: { mediaType: 'movie' },
      _avg: { score: true },
      _count: { score: true },
      having: { score: { _count: { gte: minCount } } },
      orderBy: [{ _avg: { score: 'desc' } }, { _count: { score: 'desc' } }],
      take: limit,
    });

    const enriched: TopRatedMovieItem[] = await Promise.all(
      topRated.map(async (item) => {
        const details = await fetchMovieDetails(item.mediaId);
        return {
          mediaId: item.mediaId,
          avgScore: Math.round((item._avg.score ?? 0) * 10) / 10,
          ratingCount: item._count.score,
          movieSummary: details,
        };
      })
    );

    setMovieCache(limit, minCount, enriched);

    response
      .status(200)
      .json({ data: enriched, cached: false, cacheTtlSeconds: CACHE_TTL_MS / 1000 });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve top-rated content' });
  }
};

/**
 * Public — returns top-rated tv series by community average score.
 *
 * Results are cached in memory for 5 minutes to limit TMDB API usage.
 * The response includes a `cached` flag and `cacheTtlSeconds` so callers
 * know when to expect fresh data.
 */
export const getTopRatedTv = async (_request: Request, response: Response): Promise<void> => {
  const { limit, minCount } = response.locals.query as GetTopRatedQuery;

  const cached = getTvCached(limit, minCount);
  if (cached) {
    response.status(200).json({ data: cached, cached: true, cacheTtlSeconds: CACHE_TTL_MS / 1000 });
    return;
  }

  try {
    const topRated = await prisma.rating.groupBy({
      by: ['mediaId'],
      where: { mediaType: 'tv' },
      _avg: { score: true },
      _count: { score: true },
      having: { score: { _count: { gte: minCount } } },
      orderBy: [{ _avg: { score: 'desc' } }, { _count: { score: 'desc' } }],
      take: limit,
    });

    const enriched: TopRatedTvItem[] = await Promise.all(
      topRated.map(async (item) => {
        const details = await fetchTvDetails(item.mediaId);
        return {
          mediaId: item.mediaId,
          avgScore: Math.round((item._avg.score ?? 0) * 10) / 10,
          ratingCount: item._count.score,
          tvSeriesSummary: details,
        };
      })
    );

    setTvCache(limit, minCount, enriched);

    response
      .status(200)
      .json({ data: enriched, cached: false, cacheTtlSeconds: CACHE_TTL_MS / 1000 });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve top-rated content' });
  }
};
