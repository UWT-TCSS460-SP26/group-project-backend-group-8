import { Router } from 'express';
import { getTopRated } from '@/controllers/community';
import { validateGetTopRatedQuery } from '@/middleware/validation';

const communityRouter = Router();

/**
 * GET /v1/community/top-rated
 *
 * Public discovery route. Returns top-rated movies and shows by community
 * average score, enriched with TMDB metadata. Results are cached for 5
 * minutes — the response includes `cached` and `cacheTtlSeconds` fields.
 */
communityRouter.get('/top-rated', validateGetTopRatedQuery, getTopRated);

export { communityRouter };
