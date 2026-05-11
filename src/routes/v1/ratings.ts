import { Router } from 'express';
import {
  getRatingsSummary,
  getRatingById,
  postRating,
  updateRating,
  deleteRating,
  getMyRatings,
} from '@/controllers/ratings';
import {
  validateGetRatingsQuery,
  validateGetMyRatingsQuery,
  validateNumericId,
  validateRatingBody,
  validateUpdateRatingBody,
} from '@/middleware/validation';
import { requireAuth } from '@/middleware/requireAuth';

const ratingsRouter = Router();

ratingsRouter.get('/', validateGetRatingsQuery, getRatingsSummary);
// /me must be registered before /:id so Express doesn't treat "me" as an id segment
ratingsRouter.get('/me', requireAuth, validateGetMyRatingsQuery, getMyRatings);
ratingsRouter.get('/:id', validateNumericId, getRatingById);
ratingsRouter.post('/', requireAuth, validateRatingBody, postRating);
ratingsRouter.put('/:id', requireAuth, validateNumericId, validateUpdateRatingBody, updateRating);
ratingsRouter.delete('/:id', requireAuth, validateNumericId, deleteRating);

export { ratingsRouter };
