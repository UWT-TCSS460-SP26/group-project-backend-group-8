import { Router } from 'express';
import {
  searchTvSeries,
  getTvSeriesDetails,
  getTvSeriesEnrichedDetail,
  getPopularTvSeries,
} from '@/controllers/tv.proxy';
import {
  requireTitle,
  validateNumericId,
  validateNumericLimit,
  requireEnvVar,
} from '@/middleware/validation';

const tvSeriesRouter = Router();

// All routes require the API key to be configured
tvSeriesRouter.use(requireEnvVar('TMDB_API_KEY'));

tvSeriesRouter.get('/search', requireTitle, validateNumericLimit, searchTvSeries);
tvSeriesRouter.get('/details/:id', validateNumericId, getTvSeriesDetails);
tvSeriesRouter.get('/details/:id/enriched', validateNumericId, getTvSeriesEnrichedDetail);
tvSeriesRouter.get('/popular', validateNumericLimit, getPopularTvSeries);

export { tvSeriesRouter };
