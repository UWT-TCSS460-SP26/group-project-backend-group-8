const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

export interface TmdbItemDetails {
  id: number;
  title: string;
  synopsis: string;
  posterUrl: string;
  releaseDate: string | null;
}

export const fetchTmdbItemDetails = async (
  mediaId: number,
  mediaType: 'movie' | 'tv'
): Promise<TmdbItemDetails | null> => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;
  const path = mediaType === 'movie' ? `/movie/${mediaId}` : `/tv/${mediaId}`;
  try {
    const res = await fetch(`${TMDB_BASE}${path}?api_key=${apiKey}&language=en-US`);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return {
      id: data.id as number,
      title: ((mediaType === 'movie' ? data.title : data.name) ?? '') as string,
      synopsis: (data.overview ?? '') as string,
      posterUrl: data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : '',
      releaseDate: ((mediaType === 'movie' ? data.release_date : data.first_air_date) ?? null) as
        | string
        | null,
    };
  } catch {
    return null;
  }
};

export interface MovieSummary {
  id: number;
  title: string;
  synopsis: string;
  releaseDate: string;
  posterUrl: string;
}

export interface TvSeriesSummary {
  id: number;
  title: string;
  synopsis: string;
  airDate: string;
  posterUrl: string;
}

export const fetchMovieDetails = async (movieId: number): Promise<MovieSummary | null> => {
  const apiKey = process.env.TMDB_API_KEY;
  const path = `/movie/${movieId}`;
  try {
    const result = await fetch(`${TMDB_BASE}${path}?api_key=${apiKey}`);
    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      return null;
    }

    return {
      id: data.id as number,
      title: data.title ? (data.title as string) : '',
      synopsis: data.overview ? (data.overview as string) : '',
      releaseDate: data.release_date ? (data.release_date as string) : '',
      posterUrl: data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : '',
    };
  } catch {
    return null;
  }
};

export const fetchTvDetails = async (tvId: number): Promise<TvSeriesSummary | null> => {
  const apiKey = process.env.TMDB_API_KEY;
  const path = `/tv/${tvId}`;
  try {
    const result = await fetch(`${TMDB_BASE}${path}?api_key=${apiKey}&language=en-US`);
    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      return null;
    }

    return {
      id: data.id as number,
      title: data.name ? (data.name as string) : '',
      synopsis: data.overview ? (data.overview as string) : '',
      airDate: data.first_air_date ? (data.first_air_date as string) : '',
      posterUrl: data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : '',
    };
  } catch {
    return null;
  }
};
