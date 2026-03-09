import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { config } from '../../config/app.config';
import {
  SIGNATURE_HEADER,
  SessionUserGuard,
  USER_EMAIL_HEADER,
  USER_EXP_HEADER,
  USER_NAME_HEADER,
  USER_ROLE_HEADER,
} from './session-user.guard';

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function createHeaders(
  overrides: Partial<Record<string, string | undefined>> = {},
): Record<string, string | undefined> {
  const email = overrides[USER_EMAIL_HEADER] ?? 'admin@example.com';
  const role = overrides[USER_ROLE_HEADER] ?? 'admin';
  const name = overrides[USER_NAME_HEADER] ?? 'Admin User';
  const exp = overrides[USER_EXP_HEADER] ?? String(Math.floor(Date.now() / 1000) + 300);
  const payload = `${email}\n${role}\n${name}\n${exp}`;
  const signature = overrides[SIGNATURE_HEADER] ?? sign(config.auth.sessionSecret, payload);

  return {
    [USER_EMAIL_HEADER]: email,
    [USER_ROLE_HEADER]: role,
    [USER_NAME_HEADER]: name,
    [USER_EXP_HEADER]: exp,
    [SIGNATURE_HEADER]: signature,
  };
}

function createContext(
  headers: Record<string, string | undefined>,
): ExecutionContext {
  const request = {
    header: jest.fn((name: string) => headers[name]),
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('SessionUserGuard', () => {
  const originalSecret = config.auth.sessionSecret;

  afterEach(() => {
    config.auth.sessionSecret = originalSecret;
  });

  it('throws when session secret is not configured', () => {
    config.auth.sessionSecret = '';
    const guard = new SessionUserGuard();
    expect(() => guard.canActivate(createContext(createHeaders()))).toThrow(
      ForbiddenException,
    );
  });

  it('throws when required headers are missing', () => {
    config.auth.sessionSecret = 'local-auth-session-secret';
    const guard = new SessionUserGuard();
    expect(() => guard.canActivate(createContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when session is expired', () => {
    config.auth.sessionSecret = 'local-auth-session-secret';
    const guard = new SessionUserGuard();
    const headers = createHeaders({
      [USER_EXP_HEADER]: String(Math.floor(Date.now() / 1000) - 10),
    });
    expect(() => guard.canActivate(createContext(headers))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when signature is invalid', () => {
    config.auth.sessionSecret = 'local-auth-session-secret';
    const guard = new SessionUserGuard();
    const headers = createHeaders({
      [SIGNATURE_HEADER]: 'invalid-signature',
    });
    expect(() => guard.canActivate(createContext(headers))).toThrow(
      ForbiddenException,
    );
  });

  it('allows request with valid signed session headers', () => {
    config.auth.sessionSecret = 'local-auth-session-secret';
    const guard = new SessionUserGuard();
    expect(guard.canActivate(createContext(createHeaders()))).toBe(true);
  });
});
