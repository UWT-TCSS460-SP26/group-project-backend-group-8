import { Router } from 'express';
import { searchMovie, getMovieDetails, getPopularMovies } from '../../controllers/movie.proxy';
import {
  requireTitle,
  requireId,
  validateNumericId,
  validateNumericLimit,
  requireEnvVar,
} from '../../middleware/validation';

const movieRouter = Router();

// All routes require the API key to be configured
movieRouter.use(requireEnvVar('TMDB_API_KEY'));

movieRouter.get('/search', requireTitle, validateNumericLimit, searchMovie);
movieRouter.get('/details/:id', requireId, validateNumericId, getMovieDetails);
movieRouter.get('/details/', requireId, validateNumericId, getMovieDetails);
movieRouter.get('/popular', validateNumericLimit, getPopularMovies);

export { movieRouter };
