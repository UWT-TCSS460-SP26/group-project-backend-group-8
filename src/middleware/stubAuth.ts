import { Request, Response, NextFunction } from 'express';

export function stubAuth(claims: Record<string, unknown> = {}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { user: Record<string, unknown> }).user = claims;
    next();
  };
}