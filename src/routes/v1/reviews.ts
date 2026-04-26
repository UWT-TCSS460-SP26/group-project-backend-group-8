import { Router } from 'express';
import { updateReview, deleteReview } from '@/controllers/reviews';
import { validateNumericId, validateUpdateReviewBody } from '@/middleware/validation';
import { requireAuth } from '@/middleware/requireAuth';

const reviewsRouter = Router();

reviewsRouter.put('/:id', requireAuth, validateUpdateReviewBody, updateReview);
reviewsRouter.delete('/:id', requireAuth, validateNumericId, deleteReview);

export { reviewsRouter };
