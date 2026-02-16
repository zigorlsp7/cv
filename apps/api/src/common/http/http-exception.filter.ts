import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from './request-id.middleware';

function getRequestId(req: Request, res: Response): string {
  // prefer what middleware set on res header
  const fromHeader = res.getHeader(REQUEST_ID_HEADER);
  if (typeof fromHeader === 'string' && fromHeader) return fromHeader;
  const anyReq = req as any;
  if (typeof anyReq.requestId === 'string' && anyReq.requestId) {
    return anyReq.requestId;
  }
  throw new Error('Request id is required');
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const requestId = getRequestId(req, res);

    // Default
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      // Nest can return string or object
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response) {
        const r = response as any;
        if (r.message !== undefined) {
          message = r.message;
        }
        details = r;

        // If ValidationPipe throws, message is often array of strings
        if (Array.isArray(r.message)) {
          message = 'Validation failed';
          details = { validationErrors: r.message };
          code = 'VALIDATION_ERROR';
        } else {
          // map common HttpExceptions to stable codes
          if (status === 401) code = 'UNAUTHORIZED';
          else if (status === 403) code = 'FORBIDDEN';
          else if (status === 404) code = 'NOT_FOUND';
          else if (status === 429) code = 'RATE_LIMITED';
          else if (status >= 400 && status < 500) code = 'BAD_REQUEST';
        }
      }
    }

    // Always ensure requestId header is present
    if (!res.getHeader(REQUEST_ID_HEADER)) {
      res.setHeader(REQUEST_ID_HEADER, requestId);
    }

    return res.status(status).json({
      ok: false,
      requestId,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    });
  }
}
