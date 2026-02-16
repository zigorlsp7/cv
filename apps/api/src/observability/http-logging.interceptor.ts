import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const requestId = String((req as any).requestId);
          this.logger.log(
            `${req.method} ${req.originalUrl} ${ms}ms requestId=${requestId}`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          const requestId = String((req as any).requestId);
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `${req.method} ${req.originalUrl} ${ms}ms requestId=${requestId} err=${errorMessage}`,
          );
        },
      }),
    );
  }
}
