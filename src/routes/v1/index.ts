import { Router } from 'express';
import { tvSeriesRouter } from './tv.proxy';
import { movieRouter } from './movie.proxy';
import { ratingsRouter } from './ratings';
import { reviewsRouter } from './reviews';
import { issuesRouter } from './issues';

const v1Routes = Router();

v1Routes.use('/tv', tvSeriesRouter);
v1Routes.use('/movie', movieRouter);
v1Routes.use('/ratings', ratingsRouter);
v1Routes.use('/reviews', reviewsRouter);
v1Routes.use('/issues', issuesRouter);

export { v1Routes };
