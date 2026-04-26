import { Router } from 'express';
import { postRating, updateRating, deleteRating } from '@/controllers/ratings';
import {
  validateNumericId,
  validateRatingBody,
  validateUpdateRatingBody,
} from '@/middleware/validation';
import { requireAuth } from '@/middleware/requireAuth';

const ratingsRouter = Router();

ratingsRouter.post('/', requireAuth, validateRatingBody, postRating);
ratingsRouter.put('/:id', requireAuth, validateNumericId, validateUpdateRatingBody, updateRating);
ratingsRouter.delete('/:id', requireAuth, validateNumericId, deleteRating);

export { ratingsRouter };
