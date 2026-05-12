import { Router } from 'express';
import { getTopRatedMovies, getTopRatedTv } from '@/controllers/community';
import { requireEnvVar, validateGetTopRatedQuery } from '@/middleware/validation';

const communityRouter = Router();

// All routes require the API key to be configured
communityRouter.use(requireEnvVar('TMDB_API_KEY'));

/**
 * GET /v1/community/top-rated/movies
 *
 * Public discovery route. Returns top-rated movies by community
 * average score, enriched with TMDB metadata. Results are cached for 5
 * minutes — the response includes `cached` and `cacheTtlSeconds` fields.
 */
communityRouter.get('/top-rated/movie', validateGetTopRatedQuery, getTopRatedMovies);

/**
 * GET /v1/community/top-rated/tv
 *
 * Public discovery route. Returns top-rated tv series by community
 * average score, enriched with TMDB metadata. Results are cached for 5
 * minutes — the response includes `cached` and `cacheTtlSeconds` fields.
 */
communityRouter.get('/top-rated/tv', validateGetTopRatedQuery, getTopRatedTv);

export { communityRouter };
