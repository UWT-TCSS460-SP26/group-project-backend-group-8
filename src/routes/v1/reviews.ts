import { Router } from 'express';
import { getReviews, updateReview, deleteReview } from '@/controllers/reviews';
import {
  validateGetReviewsQuery,
  validateNumericId,
  validateUpdateReviewBody,
} from '@/middleware/validation';
import { requireAuth, requireRole } from '@/middleware/requireAuth';
import { Role } from '@prisma/client';

const reviewsRouter = Router();

reviewsRouter.get('/', validateGetReviewsQuery, getReviews);
reviewsRouter.put('/:id', requireAuth, validateUpdateReviewBody, updateReview);
reviewsRouter.delete('/:id', requireAuth, requireRole(Role.ADMIN), validateNumericId, deleteReview);
reviewsRouter.delete('/:id', requireAuth, requireRole(Role.USER), validateNumericId, deleteReview);

export { reviewsRouter };
