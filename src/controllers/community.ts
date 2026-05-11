import { Request, Response } from 'express';
import { prisma } from '@/prisma';
import { fetchTmdbItemDetails, TmdbItemDetails } from '@/utils/tmdb';
import type { GetTopRatedQuery } from '@/middleware/validation';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface TopRatedItem {
  mediaId: number;
  mediaType: string;
  avgScore: number;
  ratingCount: number;
  tmdb: TmdbItemDetails | null;
}

interface CacheEntry {
  data: TopRatedItem[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

const cacheKey = (limit: number, minCount: number) => `${limit}:${minCount}`;

const getCached = (limit: number, minCount: number): TopRatedItem[] | null => {
  const key = cacheKey(limit, minCount);
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (limit: number, minCount: number, data: TopRatedItem[]): void => {
  cache.set(cacheKey(limit, minCount), { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

/** Exposed so tests can reset state between runs. */
export const clearCache = (): void => cache.clear();

/**
 * Public — returns top-rated movies and shows by community average score.
 *
 * Results are cached in memory for 5 minutes to limit TMDB API usage.
 * The response includes a `cached` flag and `cacheTtlSeconds` so callers
 * know when to expect fresh data.
 */
export const getTopRated = async (_request: Request, response: Response): Promise<void> => {
  const { limit, minCount } = response.locals.query as GetTopRatedQuery;

  const cached = getCached(limit, minCount);
  if (cached) {
    response.status(200).json({ data: cached, cached: true, cacheTtlSeconds: CACHE_TTL_MS / 1000 });
    return;
  }

  try {
    const topRated = await prisma.rating.groupBy({
      by: ['mediaId', 'mediaType'],
      _avg: { score: true },
      _count: { score: true },
      having: { score: { _count: { gte: minCount } } },
      orderBy: [{ _avg: { score: 'desc' } }, { _count: { score: 'desc' } }],
      take: limit,
    });

    const enriched: TopRatedItem[] = await Promise.all(
      topRated.map(async (item) => {
        const tmdb = await fetchTmdbItemDetails(item.mediaId, item.mediaType as 'movie' | 'tv');
        return {
          mediaId: item.mediaId,
          mediaType: item.mediaType,
          avgScore: Math.round((item._avg.score ?? 0) * 10) / 10,
          ratingCount: item._count.score,
          tmdb,
        };
      })
    );

    setCache(limit, minCount, enriched);

    response
      .status(200)
      .json({ data: enriched, cached: false, cacheTtlSeconds: CACHE_TTL_MS / 1000 });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve top-rated content' });
  }
};
