import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { REQUEST_ID_HEADER } from './request-id.middleware';

@Injectable()
export class WrapResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const requestId =
      (res.getHeader(REQUEST_ID_HEADER) as string) ||
      ((req as any).requestId as string) ||
      'unknown';

    return next.handle().pipe(
      map((data) => ({
        ok: true,
        requestId,
        data,
      })),
    );
  }
}
