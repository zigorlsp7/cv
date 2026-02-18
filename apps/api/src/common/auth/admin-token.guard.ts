import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { config } from '../../config/app.config';

export const ADMIN_TOKEN_HEADER = 'x-admin-token';

function safeStringEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = config.auth.adminApiToken;
    if (!expected) {
      throw new ForbiddenException('Admin operations are not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header(ADMIN_TOKEN_HEADER)?.trim();
    if (!provided) {
      throw new UnauthorizedException('Missing admin token');
    }

    if (!safeStringEqual(provided, expected)) {
      throw new ForbiddenException('Invalid admin token');
    }

    return true;
  }
}
