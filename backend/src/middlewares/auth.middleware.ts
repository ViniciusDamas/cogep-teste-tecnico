import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { Unauthorized } from '../utils/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(Unauthorized('Missing Bearer token'));
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    next(Unauthorized('Invalid or expired token'));
  }
}
