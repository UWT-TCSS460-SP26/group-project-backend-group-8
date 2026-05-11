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
  validateGetMyListQuery,
  validateNumericId,
  validateRatingBody,
  validateUpdateRatingBody,
} from '@/middleware/validation';
import { requireAuth } from '@/middleware/requireAuth';

const ratingsRouter = Router();

ratingsRouter.get('/', validateGetRatingsQuery, getRatingsSummary);
// /me must precede /:id so the numeric-id validator doesn't reject "me" with 400.
ratingsRouter.get('/me', requireAuth, validateGetMyListQuery, getMyRatings);
ratingsRouter.get('/:id', validateNumericId, getRatingById);
ratingsRouter.post('/', requireAuth, validateRatingBody, postRating);
ratingsRouter.put('/:id', requireAuth, validateNumericId, validateUpdateRatingBody, updateRating);
ratingsRouter.delete('/:id', requireAuth, validateNumericId, deleteRating);

export { ratingsRouter };
