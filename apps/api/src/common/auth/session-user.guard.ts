import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { config } from '../../config/app.config';

export const USER_EMAIL_HEADER = 'x-auth-user-email';
export const USER_ROLE_HEADER = 'x-auth-user-role';
export const USER_NAME_HEADER = 'x-auth-user-name';
export const USER_EXP_HEADER = 'x-auth-user-exp';
export const SIGNATURE_HEADER = 'x-auth-signature';

type AuthRole = 'admin' | 'user';

function normalizeEmail(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeRole(value: string | undefined): AuthRole | null {
  if (value === 'admin' || value === 'user') return value;
  return null;
}

function safeStringEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function buildPayload(
  email: string,
  role: AuthRole,
  name: string,
  exp: string,
): string {
  return `${email}\n${role}\n${name}\n${exp}`;
}

@Injectable()
export class SessionUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = config.auth.sessionSecret.trim();
    if (!secret) {
      throw new ForbiddenException('AUTH_SESSION_SECRET is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const email = normalizeEmail(request.header(USER_EMAIL_HEADER));
    const role = normalizeRole(request.header(USER_ROLE_HEADER));
    const name = request.header(USER_NAME_HEADER)?.trim() || '';
    const exp = request.header(USER_EXP_HEADER)?.trim() || '';
    const providedSignature = request.header(SIGNATURE_HEADER)?.trim() || '';

    if (!email || !role || !exp || !providedSignature) {
      throw new UnauthorizedException('Missing authenticated session headers');
    }

    const expSeconds = Number(exp);
    if (!Number.isFinite(expSeconds) || expSeconds <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Session has expired');
    }

    const payload = buildPayload(email, role, name, exp);
    const expectedSignature = signPayload(secret, payload);
    if (!safeStringEqual(providedSignature, expectedSignature)) {
      throw new ForbiddenException('Invalid session signature');
    }

    (request as any).user = {
      email,
      role,
      name: name || email.split('@')[0] || 'User',
    };
    return true;
  }
}
