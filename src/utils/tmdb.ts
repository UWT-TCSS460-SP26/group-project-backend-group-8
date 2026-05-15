import { MovieSummary } from '@/controllers/movie.proxy';
import { TvSeriesSummary } from '@/controllers/tv.proxy';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

export const fetchMovieDetails = async (movieId: number): Promise<MovieSummary | null> => {
  const apiKey = process.env.TMDB_API_KEY;
  const path = `/movie/${movieId}`;
  const result = await fetch(`${TMDB_BASE}${path}?api_key=${apiKey}`);

  if (!result.ok) {
    return null;
  }

  const data = (await result.json()) as Record<string, unknown>;

  return {
    id: data.id as number,
    title: data.title ? (data.title as string) : '',
    synopsis: data.overview ? (data.overview as string) : '',
    releaseDate: data.release_date ? (data.release_date as string) : '',
    posterUrl: data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : '',
  };
};

export const fetchTvDetails = async (tvId: number): Promise<TvSeriesSummary | null> => {
  const apiKey = process.env.TMDB_API_KEY;
  const path = `/tv/${tvId}`;
  const result = await fetch(`${TMDB_BASE}${path}?api_key=${apiKey}&language=en-US`);

  if (!result.ok) {
    return null;
  }

  const data = (await result.json()) as Record<string, unknown>;

  return {
    id: data.id as number,
    title: data.name ? (data.name as string) : '',
    synopsis: data.overview ? (data.overview as string) : '',
    airDate: data.first_air_date ? (data.first_air_date as string) : '',
    posterUrl: data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : '',
  };
};
