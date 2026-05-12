import { Router } from 'express';
import { searchTvSeries, getTvSeriesDetails, getPopularTvSeries } from '@/controllers/tv.proxy';
import {
  requireTitle,
  validateNumericId,
  validatePageValue,
  requireEnvVar,
} from '@/middleware/validation';

const tvSeriesRouter = Router();

// All routes require the API key to be configured
tvSeriesRouter.use(requireEnvVar('TMDB_API_KEY'));

tvSeriesRouter.get('/search', requireTitle, validatePageValue, searchTvSeries);
tvSeriesRouter.get('/details/:id', validateNumericId, getTvSeriesDetails);
tvSeriesRouter.get('/popular', validatePageValue, getPopularTvSeries);

export { tvSeriesRouter };
