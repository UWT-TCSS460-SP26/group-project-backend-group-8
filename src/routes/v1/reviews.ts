import { Router } from 'express';
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} from '@/controllers/reviews';
import {
  validateGetReviewsQuery,
  validatePostReviewBody,
  validateNumericId,
  validateUpdateReviewBody,
} from '@/middleware/validation';
import { requireAuth } from '@/middleware/requireAuth';

const reviewsRouter = Router();

reviewsRouter.get('/', validateGetReviewsQuery, getReviews);
reviewsRouter.get('/:id', validateNumericId, getReviewById);
reviewsRouter.post('/', requireAuth, validatePostReviewBody, createReview);
reviewsRouter.put('/:id', requireAuth, validateUpdateReviewBody, updateReview);
reviewsRouter.delete('/:id', requireAuth, validateNumericId, deleteReview);

export { reviewsRouter };
