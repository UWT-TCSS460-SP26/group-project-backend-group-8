import { Request, Response } from 'express';
import { fetchPaginatedTmdbData } from '../utils/tmdb';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/original';

interface TvSeriesSummary {
  id: number;
  title: string;
  synopsis: string;
  airDate: string;
  posterUrl: string;
}

export const searchTvSeries = async (request: Request, response: Response) => {
  const title = request.query.title;
  const limitQuery = request.query.limit;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const encodedTitle = encodeURIComponent(String(title));
    const result = await fetchPaginatedTmdbData(
      BASE_URL,
      '/search/tv',
      apiKey,
      limitQuery,
      `query=${encodedTitle}`
    );

    if (result.error) {
      response.status(result.status || 500).json({ error: result.error });
      return;
    }

    const transformedResults: TvSeriesSummary[] = (result.results || []).map((tvSeries) => ({
      id: tvSeries.id as number,
      title: tvSeries.name as string,
      synopsis: tvSeries.overview as string,
      airDate: tvSeries.first_air_date as string,
      posterUrl: `${IMAGE_URL}${tvSeries.poster_path}`,
    }));

    response.json({
      message: `Displaying ${transformedResults.length} out of ${result.maxResults} available results`,
      results: transformedResults,
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach TMDB service' });
  }
};

export const getTvSeriesDetails = async (request: Request, response: Response) => {
  const id = request.params.id;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(`${BASE_URL}/tv/${id}?api_key=${apiKey}`);
    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response.status(result.status).json({ error: data.message || 'TMDB API error' });
      return;
    }

    const tvSeries = data as Record<string, unknown>;
    const transformedResult: TvSeriesSummary = {
      id: tvSeries.id as number,
      title: tvSeries.name as string,
      synopsis: tvSeries.overview as string,
      airDate: tvSeries.first_air_date as string,
      posterUrl: `${IMAGE_URL}${tvSeries.poster_path}`,
    };

    response.json(transformedResult);
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach TMDB service' });
  }
};

export const getPopularTvSeries = async (request: Request, response: Response) => {
  const limitQuery = request.query.limit;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetchPaginatedTmdbData(BASE_URL, '/tv/popular', apiKey, limitQuery);

    if (result.error) {
      response.status(result.status || 500).json({ error: result.error });
      return;
    }

    const transformedResults: TvSeriesSummary[] = (result.results || []).map((tvSeries) => ({
      id: tvSeries.id as number,
      title: tvSeries.name as string,
      synopsis: tvSeries.overview as string,
      airDate: tvSeries.first_air_date as string,
      posterUrl: `${IMAGE_URL}${tvSeries.poster_path}`,
    }));

    response.json({
      message: `Displaying ${transformedResults.length} out of ${result.maxResults} available results`,
      results: transformedResults,
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach TMDB service' });
  }
};
