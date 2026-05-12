import { Router } from 'express';
import {
  getReviews,
  getReviewById,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
} from '@/controllers/reviews';
import {
  validateGetReviewsQuery,
  validateGetMyListQuery,
  validatePostReviewBody,
  validateNumericId,
  validateUpdateReviewBody,
  requireEnvVar,
} from '@/middleware/validation';
import { requireAuth } from '@/middleware/requireAuth';

const reviewsRouter = Router();

reviewsRouter.get('/', validateGetReviewsQuery, getReviews);
// /me must precede /:id so the numeric-id validator doesn't reject "me" with 400.
reviewsRouter.get(
  '/me',
  requireAuth,
  requireEnvVar('TMDB_API_KEY'),
  validateGetMyListQuery,
  getMyReviews
);
reviewsRouter.get('/:id', validateNumericId, getReviewById);
reviewsRouter.post('/', requireAuth, validatePostReviewBody, createReview);
reviewsRouter.put('/:id', requireAuth, validateUpdateReviewBody, updateReview);
reviewsRouter.delete('/:id', requireAuth, validateNumericId, deleteReview);

export { reviewsRouter };
