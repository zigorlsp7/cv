import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const HEADER = 'x-request-id';
  const raw = req.header(HEADER);
  const requestId = raw && raw.trim() ? raw.trim() : randomUUID();

  req.requestId = requestId;
  res.setHeader(HEADER, requestId);
  next();
}
