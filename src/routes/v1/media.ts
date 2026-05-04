import { Router } from 'express';
import { getMediaDetails } from '@/controllers/media';
import { validateNumericId, validateGetMediaQuery, requireEnvVar } from '@/middleware/validation';

const mediaRouter = Router();

// Requires TMDB_API_KEY — same guard as movie.proxy and tv.proxy
mediaRouter.use(requireEnvVar('TMDB_API_KEY'));

/**
 * GET /v1/media/:id?type=movie|tv
 *
 * TMDB details + community reviews and rating in a single request.
 * No auth required — public read.
 */
mediaRouter.get('/:id', validateNumericId, validateGetMediaQuery, getMediaDetails);

export { mediaRouter };
