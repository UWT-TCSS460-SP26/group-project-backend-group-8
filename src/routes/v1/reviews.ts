import { Router } from 'express';
import { getReviews, updateReview, deleteReview } from '@/controllers/reviews';
import {
  validateGetReviewsQuery,
  validateNumericId,
  validateUpdateReviewBody,
} from '@/middleware/validation';
import { requireAuth } from '@/middleware/requireAuth';

const reviewsRouter = Router();

reviewsRouter.get('/', validateGetReviewsQuery, getReviews);
reviewsRouter.put('/:id', requireAuth, validateUpdateReviewBody, updateReview);
reviewsRouter.delete('/:id', requireAuth, validateNumericId, deleteReview);

export { reviewsRouter };
