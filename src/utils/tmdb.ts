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
      posterUrl: `${IMAGE_BASE}${data.poster_path ?? ''}`,
      releaseDate: ((mediaType === 'movie' ? data.release_date : data.first_air_date) ?? null) as
        | string
        | null,
    };
  } catch {
    return null;
  }
};
