import { Request, Response } from 'express';
import { fetchPaginatedTmdbData } from '../utils/tmdb';

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
      message: `Displaying ${transformedResults.length} out of ${result.totalResults} results`,
      results: transformedResults,
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach TMDB service' });
  }
};

export const getMovieDetails = async (request: Request, response: Response) => {
  const id = request.params.id || request.query.id;
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
    response.status(502).json({ error: 'Failed to reach TMDB service' });
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
      message: `Displaying ${transformedResults.length} out of ${result.totalResults} results`,
      results: transformedResults,
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach TMDB service' });
  }
};
