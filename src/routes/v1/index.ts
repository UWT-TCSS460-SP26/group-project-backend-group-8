import { Router } from 'express';
import { tvSeriesRouter } from './tv.proxy';
import { movieRouter } from './movie.proxy';

const v1Routes = Router();

v1Routes.use('/tv', tvSeriesRouter);
v1Routes.use('/movie', movieRouter);

export { v1Routes };
