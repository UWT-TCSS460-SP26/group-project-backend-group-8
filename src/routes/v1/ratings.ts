import { Router } from 'express';
import {
  getRatingsSummary,
  getRatingById,
  postRating,
  updateRating,
  deleteRating,
} from '@/controllers/ratings';
import {
  validateGetRatingsQuery,
  validateNumericId,
  validateRatingBody,
  validateUpdateRatingBody,
} from '@/middleware/validation';
import { requireAuth } from '@/middleware/requireAuth';

const ratingsRouter = Router();

ratingsRouter.get('/', validateGetRatingsQuery, getRatingsSummary);
ratingsRouter.get('/:id', validateNumericId, getRatingById);
ratingsRouter.post('/', requireAuth, validateRatingBody, postRating);
ratingsRouter.put('/:id', requireAuth, validateNumericId, validateUpdateRatingBody, updateRating);
ratingsRouter.delete('/:id', requireAuth, validateNumericId, deleteRating);

export { ratingsRouter };
