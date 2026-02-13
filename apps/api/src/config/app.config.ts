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
    protocol: 'http/protobuf' | 'grpc';
    tracesExporter: string;
    metricsExporter: string;
    logsExporter: string;
  };
};

const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

function parseBooleanEnv(input: unknown, fallback: boolean): boolean {
  if (input === undefined || input === null || input === '') return fallback;
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
  const nodeEnv =
    (process.env.NODE_ENV as NodeEnv | undefined) ?? 'development';
  const fileName = nodeEnv === 'test' ? '.env.test' : '.env';
  const apiRoot = resolveApiRoot(__dirname);
  const filePath = path.join(apiRoot, fileName);

  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, quiet: true });
  }
}

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().min(1).max(65535),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),

    RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(100),

    CORS_ORIGINS: z.string().default(''),
    CORS_METHODS: z.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
    CORS_ALLOWED_HEADERS: z
      .string()
      .default('Content-Type,Authorization,X-Request-Id'),
    CORS_EXPOSED_HEADERS: z.string().default('X-Request-Id'),
    CORS_CREDENTIALS: z.any().default('true'),
    CORS_MAX_AGE_SECONDS: z.coerce.number().int().min(0).default(600),

    TRUST_PROXY: z.string().default('false'),
    REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    HEADERS_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    KEEP_ALIVE_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
    REQUEST_BODY_LIMIT: z.string().min(1).default('1mb'),

    OTEL_SERVICE_NAME: z.string().min(1).default('cv-api'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z
      .string()
      .url()
      .default('http://localhost:4318'),
    OTEL_EXPORTER_OTLP_PROTOCOL: z
      .enum(['http/protobuf', 'grpc'])
      .default('http/protobuf'),
    OTEL_TRACES_EXPORTER: z.string().default('otlp'),
    OTEL_METRICS_EXPORTER: z.string().default('none'),
    OTEL_LOGS_EXPORTER: z.string().default('none'),
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
      credentials = parseBooleanEnv(data.CORS_CREDENTIALS, true);
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
    CORS_ORIGINS: process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN,
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
      credentials: parseBooleanEnv(raw.CORS_CREDENTIALS, true),
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
      protocol: raw.OTEL_EXPORTER_OTLP_PROTOCOL,
      tracesExporter: raw.OTEL_TRACES_EXPORTER,
      metricsExporter: raw.OTEL_METRICS_EXPORTER,
      logsExporter: raw.OTEL_LOGS_EXPORTER,
    },
  };
}

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = buildConfig(readEnv());
  }
  return cachedConfig;
}

export const config = getConfig();
