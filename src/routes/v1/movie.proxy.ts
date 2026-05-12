import { Router } from 'express';
import { searchMovie, getMovieDetails, getPopularMovies } from '@/controllers/movie.proxy';
import {
  requireTitle,
  validateNumericId,
  validatePageValue,
  requireEnvVar,
} from '@/middleware/validation';

const movieRouter = Router();

// All routes require the API key to be configured
movieRouter.use(requireEnvVar('TMDB_API_KEY'));

movieRouter.get('/search', requireTitle, validatePageValue, searchMovie);
movieRouter.get('/details/:id', validateNumericId, getMovieDetails);
movieRouter.get('/popular', validatePageValue, getPopularMovies);

export { movieRouter };
