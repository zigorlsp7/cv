import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const requestId =
      (req as any).requestId ?? res.getHeader('x-request-id') ?? undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message: string | string[] = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      // Nest can return string or object for exception response
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response) {
        const r = response as any;
        message = r.message ?? message;
        details = r;
      }

      // basic mapping
      if (status === HttpStatus.BAD_REQUEST) code = 'BAD_REQUEST';
      else if (status === HttpStatus.UNAUTHORIZED) code = 'UNAUTHORIZED';
      else if (status === HttpStatus.FORBIDDEN) code = 'FORBIDDEN';
      else if (status === HttpStatus.NOT_FOUND) code = 'NOT_FOUND';
      else code = 'HTTP_ERROR';
    }

    res.status(status).json({
      code,
      message,
      requestId,
      details: status >= 500 ? undefined : details,
    });
  }
}
