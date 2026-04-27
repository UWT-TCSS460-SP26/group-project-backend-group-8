import { Request, Response, NextFunction } from 'express';

export function stubAuth(claims: Record<string, unknown> = {}) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    (_req as any).user = claims;
    next();
  };
}