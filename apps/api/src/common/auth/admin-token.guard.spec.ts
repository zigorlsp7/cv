import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { config } from '../../config/app.config';
import { ADMIN_TOKEN_HEADER, AdminTokenGuard } from './admin-token.guard';

function createContext(headerValue?: string): ExecutionContext {
  const request = {
    header: jest.fn((name: string) =>
      name === ADMIN_TOKEN_HEADER ? headerValue : undefined,
    ),
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('AdminTokenGuard', () => {
  const originalAdminToken = config.auth.adminApiToken;

  afterEach(() => {
    config.auth.adminApiToken = originalAdminToken;
  });

  it('throws when admin operations are not configured', () => {
    config.auth.adminApiToken = '';
    const guard = new AdminTokenGuard();

    expect(() => guard.canActivate(createContext('any-token'))).toThrow(
      ForbiddenException,
    );
  });

  it('throws when header is missing or blank', () => {
    config.auth.adminApiToken = 'local-admin-token';
    const guard = new AdminTokenGuard();

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(createContext('   '))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when token length mismatches expected token', () => {
    config.auth.adminApiToken = 'local-admin-token';
    const guard = new AdminTokenGuard();

    expect(() => guard.canActivate(createContext('short'))).toThrow(
      ForbiddenException,
    );
  });

  it('throws when token has same length but invalid value', () => {
    config.auth.adminApiToken = 'local-admin-token';
    const guard = new AdminTokenGuard();

    expect(() => guard.canActivate(createContext('x'.repeat(17)))).toThrow(
      ForbiddenException,
    );
  });

  it('allows request when valid token is provided', () => {
    config.auth.adminApiToken = 'local-admin-token';
    const guard = new AdminTokenGuard();

    expect(guard.canActivate(createContext('  local-admin-token  '))).toBe(true);
  });
});
