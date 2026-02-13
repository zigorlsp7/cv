import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const raw = req.header(REQUEST_ID_HEADER);
  const requestId = raw && raw.trim() ? raw.trim() : randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
