import { Router } from 'express';
import { getReviews, createReview, updateReview, deleteReview } from '@/controllers/reviews';
import {
  validateGetReviewsQuery,
  validatePostReviewBody,
  validateNumericId,
  validateUpdateReviewBody,
} from '@/middleware/validation';
import { requireAuth, requireRole } from '@/middleware/requireAuth';
import { Role } from '@/generated/prisma';

const reviewsRouter = Router();

reviewsRouter.get('/', validateGetReviewsQuery, getReviews);
reviewsRouter.post('/', requireAuth, validatePostReviewBody, createReview);
reviewsRouter.put('/:id', requireAuth, validateUpdateReviewBody, updateReview);
reviewsRouter.delete('/:id', requireAuth, requireRole(Role.ADMIN), validateNumericId, deleteReview);
reviewsRouter.delete('/:id', requireAuth, requireRole(Role.USER), validateNumericId, deleteReview);

export { reviewsRouter };
