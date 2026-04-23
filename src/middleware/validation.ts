import { Request, Response, NextFunction } from 'express';

/**
 * Validates that a required environment variable is set.
 * Returns a middleware function that checks for the given key in process.env.
 */
export const requireEnvVar = (key: string) => {
  return (_request: Request, response: Response, next: NextFunction) => {
    if (!process.env[key]) {
      response.status(500).json({ error: `${key} is not configured` });
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
 * Validates that the 'id' route param is present.
 */
export const requireId = (request: Request, response: Response, next: NextFunction) => {
  const id = request.params.id;
  if (!id) {
    response.status(400).json({ error: 'Parameter "id" is required (route param)' });
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
