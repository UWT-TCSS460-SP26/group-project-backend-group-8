import { Request, Response } from 'express';
import { fetchPaginatedTmdbData } from '../utils/tmdb';
import { prisma } from '@/prisma';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/original';

interface MovieSummary {
  id: number;
  title: string;
  synopsis: string;
  releaseDate: string;
  posterUrl: string;
}

export const searchMovie = async (request: Request, response: Response) => {
  const title = request.query.title;
  const limitQuery = request.query.limit;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const encodedTitle = encodeURIComponent(String(title));
    const result = await fetchPaginatedTmdbData(
      BASE_URL,
      '/search/movie',
      apiKey,
      limitQuery,
      `query=${encodedTitle}`
    );

    if (result.error) {
      response.status(result.status || 500).json({ error: result.error });
      return;
    }

    const transformedResults: MovieSummary[] = (result.results || []).map((movie) => ({
      id: movie.id as number,
      title: movie.title as string,
      synopsis: movie.overview as string,
      releaseDate: movie.release_date as string,
      posterUrl: `${IMAGE_URL}${movie.poster_path}`,
    }));

    response.json({
      message: `Displaying ${transformedResults.length} out of ${result.maxResults} available results`,
      results: transformedResults,
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach service' });
  }
};

export const getMovieDetails = async (request: Request, response: Response) => {
  const id = request.params.id;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(`${BASE_URL}/movie/${id}?api_key=${apiKey}`);
    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response.status(result.status).json({ error: data.message || 'TMDB API error' });
      return;
    }

    const movie = data as Record<string, unknown>;
    const transformedResult: MovieSummary = {
      id: movie.id as number,
      title: movie.title as string,
      synopsis: movie.overview as string,
      releaseDate: movie.release_date as string,
      posterUrl: `${IMAGE_URL}${movie.poster_path}`,
    };

    response.json(transformedResult);
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach service' });
  }
};

/**
 * Public — TMDB metadata + community aggregate + recent reviews in a single
 * round trip. Empty community = zero counts and an empty reviews array (not
 * null), so the FE can render a consistent shape without branching.
 */
export const getMovieEnrichedDetail = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const tmdbResult = await fetch(`${BASE_URL}/movie/${id}?api_key=${apiKey}`);
    const tmdbData = (await tmdbResult.json()) as Record<string, unknown>;

    if (!tmdbResult.ok) {
      response.status(tmdbResult.status).json({ error: tmdbData.message || 'TMDB API error' });
      return;
    }

    const where = { mediaId: id, mediaType: 'movie' as const };
    const [aggregate, reviewCount, recentReviews] = await Promise.all([
      prisma.rating.aggregate({ where, _avg: { score: true }, _count: { _all: true } }),
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const tmdb: MovieSummary = {
      id: tmdbData.id as number,
      title: tmdbData.title as string,
      synopsis: tmdbData.overview as string,
      releaseDate: tmdbData.release_date as string,
      posterUrl: `${IMAGE_URL}${tmdbData.poster_path}`,
    };

    response.status(200).json({
      data: {
        tmdb,
        community: {
          averageScore: aggregate._avg.score,
          ratingCount: aggregate._count._all,
          reviewCount,
          recentReviews,
        },
      },
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach service' });
  }
};

export const getPopularMovies = async (request: Request, response: Response) => {
  const limitQuery = request.query.limit;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetchPaginatedTmdbData(BASE_URL, '/movie/popular', apiKey, limitQuery);

    if (result.error) {
      response.status(result.status || 500).json({ error: result.error });
      return;
    }

    const transformedResults: MovieSummary[] = (result.results || []).map((movie) => ({
      id: movie.id as number,
      title: movie.title as string,
      synopsis: movie.overview as string,
      releaseDate: movie.release_date as string,
      posterUrl: `${IMAGE_URL}${movie.poster_path}`,
    }));

    response.json({
      message: `Displaying ${transformedResults.length} out of ${result.maxResults} available results`,
      results: transformedResults,
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach service' });
  }
};
