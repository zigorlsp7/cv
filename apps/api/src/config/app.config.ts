import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

export type NodeEnv = 'development' | 'test' | 'production';
export type TrustProxy =
  | boolean
  | number
  | 'loopback'
  | 'linklocal'
  | 'uniquelocal';

export type AppConfig = {
  nodeEnv: NodeEnv;
  port: number;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  rateLimit: {
    ttlMs: number;
    limit: number;
  };
  cors: {
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAgeSeconds: number;
  };
  http: {
    trustProxy: TrustProxy;
    requestTimeoutMs: number;
    headersTimeoutMs: number;
    keepAliveTimeoutMs: number;
    requestBodyLimit: string;
  };
  otel: {
    serviceName: string;
    endpoint: string;
  };
  features: Record<string, boolean>;
};

const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

function parseBooleanEnv(input: unknown): boolean {
  if (input === undefined || input === null || input === '') {
    throw new Error('Expected a boolean-like string');
  }
  if (typeof input === 'boolean') return input;
  if (typeof input !== 'string')
    throw new Error('Expected a boolean-like string');

  const normalized = input.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;

  throw new Error(`Invalid boolean value: ${input}`);
}

function parseList(input: string): string[] {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parseFeatureFlagAssignments(input: string): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!input.trim()) return out;

  const entries = parseList(input);
  for (const entry of entries) {
    const [rawName, rawValue] = entry.split('=');
    const name = rawName?.trim();
    const value = rawValue?.trim();

    if (!name) {
      throw new Error(`Invalid feature flag entry: "${entry}"`);
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) {
      throw new Error(
        `Invalid feature flag name "${name}". Use letters/numbers/_/- only`,
      );
    }
    if (value === undefined) {
      throw new Error(
        `Feature flag "${name}" must specify boolean value (example: ${name}=true)`,
      );
    }

    out[name] = parseBooleanEnv(value);
  }

  return out;
}

function isValidHttpOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseTrustProxy(value: string): TrustProxy {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (
    normalized === 'loopback' ||
    normalized === 'linklocal' ||
    normalized === 'uniquelocal'
  ) {
    return normalized;
  }
  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }
  throw new Error(
    'TRUST_PROXY must be one of: false, true, loopback, linklocal, uniquelocal, or a numeric hop count',
  );
}

function resolveApiRoot(fromDir: string): string {
  let current = fromDir;
  for (let i = 0; i < 12; i += 1) {
    if (
      fs.existsSync(path.join(current, 'package.json')) &&
      fs.existsSync(path.join(current, 'src'))
    ) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

function loadEnvFile() {
  const nodeEnvRaw = process.env.NODE_ENV;
  if (!nodeEnvRaw) {
    throw new Error('Invalid environment configuration: NODE_ENV is required');
  }
  if (
    nodeEnvRaw !== 'development' &&
    nodeEnvRaw !== 'test' &&
    nodeEnvRaw !== 'production'
  ) {
    throw new Error(
      'Invalid environment configuration: NODE_ENV must be development, test, or production',
    );
  }
  const nodeEnv = nodeEnvRaw as NodeEnv;
  const fileName = nodeEnv === 'test' ? '.env.test' : '.env';
  const apiRoot = resolveApiRoot(__dirname);
  const filePath = path.join(apiRoot, fileName);

  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, quiet: true });
  }
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: z.coerce.number().int().min(1).max(65535),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().min(1).max(65535),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),

    RATE_LIMIT_TTL_MS: z.coerce.number().int().positive(),
    RATE_LIMIT_LIMIT: z.coerce.number().int().positive(),

    CORS_ORIGINS: z.string(),
    CORS_METHODS: z.string(),
    CORS_ALLOWED_HEADERS: z.string(),
    CORS_EXPOSED_HEADERS: z.string(),
    CORS_CREDENTIALS: z.string().min(1),
    CORS_MAX_AGE_SECONDS: z.coerce.number().int().min(0),

    TRUST_PROXY: z.string(),
    REQUEST_TIMEOUT_MS: z.coerce.number().int().positive(),
    HEADERS_TIMEOUT_MS: z.coerce.number().int().positive(),
    KEEP_ALIVE_TIMEOUT_MS: z.coerce.number().int().positive(),
    REQUEST_BODY_LIMIT: z.string().min(1),

    OTEL_SERVICE_NAME: z.string().min(1),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url(),

    FEATURE_FLAGS: z.string(),
  })
  .superRefine((data, ctx) => {
    const origins = parseList(data.CORS_ORIGINS);
    if (data.NODE_ENV === 'production' && origins.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must not be empty in production',
      });
    }

    for (const origin of origins) {
      if (!isValidHttpOrigin(origin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGINS'],
          message: `Invalid CORS origin: ${origin}. Use full origin format, e.g. http://localhost:3001`,
        });
      }
    }

    let credentials = true;
    try {
      credentials = parseBooleanEnv(data.CORS_CREDENTIALS);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_CREDENTIALS'],
        message: 'CORS_CREDENTIALS must be true/false (or 1/0, yes/no)',
      });
    }

    if (credentials && origins.includes('*')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'Wildcard CORS origin is incompatible with credentials=true',
      });
    }

    if (data.HEADERS_TIMEOUT_MS <= data.KEEP_ALIVE_TIMEOUT_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['HEADERS_TIMEOUT_MS'],
        message:
          'HEADERS_TIMEOUT_MS must be greater than KEEP_ALIVE_TIMEOUT_MS',
      });
    }

    try {
      parseTrustProxy(data.TRUST_PROXY);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['TRUST_PROXY'],
        message: error instanceof Error ? error.message : 'Invalid TRUST_PROXY',
      });
    }

    try {
      parseFeatureFlagAssignments(data.FEATURE_FLAGS);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FEATURE_FLAGS'],
        message:
          error instanceof Error
            ? error.message
            : 'Invalid FEATURE_FLAGS format',
      });
    }

  });

let cachedConfig: AppConfig | undefined;

function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const pathLabel = issue.path.length > 0 ? issue.path.join('.') : 'env';
      return `${pathLabel}: ${issue.message}`;
    })
    .join('; ');
}

function readEnv(): z.infer<typeof envSchema> {
  loadEnvFile();

  const parseResult = envSchema.safeParse({
    ...process.env,
  });

  if (!parseResult.success) {
    throw new Error(
      `Invalid environment configuration: ${formatValidationError(parseResult.error)}`,
    );
  }
  return parseResult.data;
}

function buildConfig(raw: z.infer<typeof envSchema>): AppConfig {
  const origins = parseList(raw.CORS_ORIGINS);
  const methods = parseList(raw.CORS_METHODS);
  const allowedHeaders = parseList(raw.CORS_ALLOWED_HEADERS);
  const exposedHeaders = parseList(raw.CORS_EXPOSED_HEADERS);
  const parsedFeatureFlags = parseFeatureFlagAssignments(raw.FEATURE_FLAGS);

  return {
    nodeEnv: raw.NODE_ENV,
    port: raw.PORT,
    logLevel: raw.LOG_LEVEL,
    db: {
      host: raw.DB_HOST,
      port: raw.DB_PORT,
      user: raw.DB_USER,
      password: raw.DB_PASSWORD,
      name: raw.DB_NAME,
    },
    rateLimit: {
      ttlMs: raw.RATE_LIMIT_TTL_MS,
      limit: raw.RATE_LIMIT_LIMIT,
    },
    cors: {
      origins,
      methods,
      allowedHeaders,
      exposedHeaders,
      credentials: parseBooleanEnv(raw.CORS_CREDENTIALS),
      maxAgeSeconds: raw.CORS_MAX_AGE_SECONDS,
    },
    http: {
      trustProxy: parseTrustProxy(raw.TRUST_PROXY),
      requestTimeoutMs: raw.REQUEST_TIMEOUT_MS,
      headersTimeoutMs: raw.HEADERS_TIMEOUT_MS,
      keepAliveTimeoutMs: raw.KEEP_ALIVE_TIMEOUT_MS,
      requestBodyLimit: raw.REQUEST_BODY_LIMIT,
    },
    otel: {
      serviceName: raw.OTEL_SERVICE_NAME,
      endpoint: raw.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
    features: parsedFeatureFlags,
  };
}

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = buildConfig(readEnv());
  }
  return cachedConfig;
}

export const config = getConfig();
