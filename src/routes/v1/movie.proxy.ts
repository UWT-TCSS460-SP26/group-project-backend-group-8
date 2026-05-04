import { Router } from 'express';
import {
  searchMovie,
  getMovieDetails,
  getMovieEnrichedDetail,
  getPopularMovies,
} from '@/controllers/movie.proxy';
import {
  requireTitle,
  validateNumericId,
  validateNumericLimit,
  requireEnvVar,
} from '@/middleware/validation';

const movieRouter = Router();

// All routes require the API key to be configured
movieRouter.use(requireEnvVar('TMDB_API_KEY'));

movieRouter.get('/search', requireTitle, validateNumericLimit, searchMovie);
movieRouter.get('/details/:id', validateNumericId, getMovieDetails);
movieRouter.get('/details/:id/enriched', validateNumericId, getMovieEnrichedDetail);
movieRouter.get('/popular', validateNumericLimit, getPopularMovies);

export { movieRouter };
