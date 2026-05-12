import { Router } from 'express';
import {
  getRatingsSummary,
  getRatingById,
  getMyRatings,
  postRating,
  updateRating,
  deleteRating,
} from '@/controllers/ratings';
import {
  validateGetRatingsQuery,
  validateGetMyRatingsQuery,
  validateNumericId,
  validateRatingBody,
  validateUpdateRatingBody,
  requireEnvVar,
} from '@/middleware/validation';
import { requireAuth } from '@/middleware/requireAuth';

const ratingsRouter = Router();

ratingsRouter.get('/', validateGetRatingsQuery, getRatingsSummary);
// /me must be registered before /:id so Express doesn't treat "me" as an id segment
ratingsRouter.get(
  '/me',
  requireAuth,
  requireEnvVar('TMDB_API_KEY'),
  validateGetMyRatingsQuery,
  getMyRatings
);
ratingsRouter.get('/:id', validateNumericId, getRatingById);
ratingsRouter.post('/', requireAuth, validateRatingBody, postRating);
ratingsRouter.put('/:id', requireAuth, validateNumericId, validateUpdateRatingBody, updateRating);
ratingsRouter.delete('/:id', requireAuth, validateNumericId, deleteRating);

export { ratingsRouter };
