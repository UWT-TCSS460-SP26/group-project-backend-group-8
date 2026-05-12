import { Request, Response } from 'express';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/original';

interface TvSeriesSummary {
  id: number;
  title: string;
  synopsis: string;
  airDate: string;
  posterUrl: string;
}

interface TmdbResponse {
  page?: number;
  results?: Array<{
    id: number;
    name: string;
    overview: string;
    first_air_date: string;
    poster_path: string;
  }>;
  total_results?: number;
  total_pages?: number;
  errors?: string[];
  status_message?: string;
  status_code?: number;
}

export const searchTvSeries = async (request: Request, response: Response) => {
  const title = request.query.title;
  const pageQuery = request.query.page || 1;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const encodedTitle = encodeURIComponent(String(title));
    const result = await fetch(
      `${BASE_URL}/search/tv?api_key=${apiKey}&query=${encodedTitle}&page=${pageQuery}`
    );
    const data = (await result.json()) as TmdbResponse;

    if (!result.ok) {
      if (
        data.errors?.some?.((e: string) =>
          e.toLowerCase().includes('page must be less than or equal to')
        )
      ) {
        response.status(200).json({
          results: [],
          pagination: {
            page: Number(pageQuery) || 1,
            totalResults: 0,
            totalPages: 0,
          },
        });
        return;
      }
      response
        .status(result.status || 500)
        .json({ error: data.status_message || data.errors || 'TMDB API error' });
      return;
    }

    const transformedResults: TvSeriesSummary[] = (data.results || []).map((tvSeries) => ({
      id: tvSeries.id,
      title: tvSeries.name,
      synopsis: tvSeries.overview,
      airDate: tvSeries.first_air_date,
      posterUrl: `${IMAGE_URL}${tvSeries.poster_path}`,
    }));

    response.json({
      results: transformedResults,
      pagination: {
        page: data.page || Number(pageQuery) || 1,
        totalResults: data.total_results || 0,
        totalPages: data.total_pages || 0,
      },
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach service' });
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
    response.status(502).json({ error: 'Failed to reach service' });
  }
};

export const getPopularTvSeries = async (request: Request, response: Response) => {
  const pageQuery = request.query.page || 1;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(`${BASE_URL}/tv/popular?api_key=${apiKey}&page=${pageQuery}`);
    const data = (await result.json()) as TmdbResponse;

    if (!result.ok) {
      if (
        data.errors?.some?.((e: string) =>
          e.toLowerCase().includes('page must be less than or equal to')
        )
      ) {
        response.status(200).json({
          results: [],
          pagination: {
            page: Number(pageQuery) || 1,
            totalResults: 0,
            totalPages: 0,
          },
        });
        return;
      }
      response
        .status(result.status || 500)
        .json({ error: data.status_message || data.errors || 'TMDB API error' });
      return;
    }

    const transformedResults: TvSeriesSummary[] = (data.results || []).map((tvSeries) => ({
      id: tvSeries.id,
      title: tvSeries.name,
      synopsis: tvSeries.overview,
      airDate: tvSeries.first_air_date,
      posterUrl: `${IMAGE_URL}${tvSeries.poster_path}`,
    }));

    const totalPages = data.total_pages && data.total_pages > 500 ? 500 : data.total_pages || 0;
    const totalResults = totalPages === 500 ? 10000 : data.total_results || 0;

    response.json({
      results: transformedResults,
      pagination: {
        page: data.page || Number(pageQuery) || 1,
        totalResults: totalResults,
        totalPages: totalPages,
      },
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach service' });
  }
};
