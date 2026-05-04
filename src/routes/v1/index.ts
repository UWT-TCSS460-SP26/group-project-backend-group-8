import { Router } from 'express';
import { tvSeriesRouter } from './tv.proxy';
import { movieRouter } from './movie.proxy';
import { ratingsRouter } from './ratings';
import { reviewsRouter } from './reviews';
import { mediaRouter } from './media';

const v1Routes = Router();

v1Routes.use('/tv', tvSeriesRouter);
v1Routes.use('/movie', movieRouter);
v1Routes.use('/ratings', ratingsRouter);
v1Routes.use('/reviews', reviewsRouter);
v1Routes.use('/media', mediaRouter);

export { v1Routes };
