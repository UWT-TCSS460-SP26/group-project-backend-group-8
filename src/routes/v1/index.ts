import { Router } from 'express';
import { tvSeriesRouter } from './tv.proxy';
import { movieRouter } from './movie.proxy';
import { ratingsRouter } from './ratings';
import { reviewsRouter } from './reviews';
import { issuesRouter } from './issues';
import { communityRouter } from './community';

const v1Routes = Router();

v1Routes.use('/tv', tvSeriesRouter);
v1Routes.use('/movie', movieRouter);
v1Routes.use('/ratings', ratingsRouter);
v1Routes.use('/reviews', reviewsRouter);
v1Routes.use('/issues', issuesRouter);
v1Routes.use('/community', communityRouter);

export { v1Routes };
