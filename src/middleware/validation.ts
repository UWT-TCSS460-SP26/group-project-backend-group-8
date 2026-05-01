import { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

export const PostRatingSchema = z.object({
  mediaId: z.number().int().positive(),
  mediaType: z.enum(['movie', 'tv']),
  score: z.number().min(1).max(10),
});

export const UpdateRatingSchema = z.object({
  score: z.number().min(1).max(10),
});

export const PostReviewSchema = z.object({
  mediaId: z.number().int().positive(),
  mediaType: z.enum(['movie', 'tv']),
  title: z.string().min(1).optional(),
  body: z.string().min(1),
});

export const UpdateReviewSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1),
});

// Public-GET query schemas. z.coerce parses Express's stringly-typed req.query.
const MediaQuery = {
  mediaId: z.coerce.number().int().positive(),
  mediaType: z.enum(['movie', 'tv']),
};

export const GetReviewsQuerySchema = z.object({
  ...MediaQuery,
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sort: z.enum(['createdAt', 'id']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const GetRatingsQuerySchema = z.object({ ...MediaQuery });

const validate =
  (source: 'body' | 'params' | 'query', schema: z.ZodType): RequestHandler =>
  (request, response, next) => {
    const result = schema.safeParse(request[source]);
    if (!result.success) {
      response.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    if (source === 'query') {
      // Express 5 made req.query a read-only getter — assignment silently
      // fails. Hand the parsed value to the controller via res.locals.
      response.locals.query = result.data;
    } else {
      (request as unknown as Record<string, unknown>)[source] = result.data;
    }
    next();
  };

export const validateRatingBody = validate('body', PostRatingSchema);
export const validateUpdateRatingBody = validate('body', UpdateRatingSchema);
export const validatePostReviewBody = validate('body', PostReviewSchema);
export const validateUpdateReviewBody = validate('body', UpdateReviewSchema);
export const validateGetReviewsQuery = validate('query', GetReviewsQuerySchema);
export const validateGetRatingsQuery = validate('query', GetRatingsQuerySchema);

export type RatingBody = z.infer<typeof PostRatingSchema>;
export type UpdateRatingBody = z.infer<typeof UpdateRatingSchema>;
export type PostReviewBody = z.infer<typeof PostReviewSchema>;
export type UpdateReviewBody = z.infer<typeof UpdateReviewSchema>;
export type GetReviewsQuery = z.infer<typeof GetReviewsQuerySchema>;
export type GetRatingsQuery = z.infer<typeof GetRatingsQuerySchema>;

/**
 * Validates that a required environment variable is set.
 * Returns a middleware function that checks for the given key in process.env.
 */
export const requireEnvVar = (key: string) => {
  return (_request: Request, response: Response, next: NextFunction) => {
    if (!process.env[key]) {
      response.status(500).json({ error: `API key is not configured` });
      return;
    }
    next();
  };
};

/**
 * Validates that 'title' is present as a query param.
 */
export const requireTitle = (request: Request, response: Response, next: NextFunction) => {
  const title = request.query.title;
  if (!title) {
    response.status(400).json({ error: 'Parameter "title" is required (query param)' });
    return;
  }
  next();
};

/**
 * Validates that the 'id' route parameter is a positive integer.
 */
export const validateNumericId = (request: Request, response: Response, next: NextFunction) => {
  const id = Number(request.params.id) || Number(request.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ error: 'Parameter "id" must be a positive integer' });
    return;
  }
  next();
};

/**
 * Validates that the 'limit' route parameter is a positive integer.
 */
export const validateNumericLimit = (request: Request, response: Response, next: NextFunction) => {
  const limitValue = request.params.limit || request.query.limit;

  if (limitValue !== undefined) {
    const limit = Number(limitValue);
    if (!Number.isInteger(limit) || limit <= 0) {
      response.status(400).json({ error: 'Parameter "limit" must be a positive integer' });
      return;
    }
  }
  next();
};
