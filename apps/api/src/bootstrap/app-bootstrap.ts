import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import helmet from 'helmet';
import { AppConfig } from '../config/app.config';
import { HttpExceptionFilter } from '../common/http/http-exception.filter';
import { requestIdMiddleware } from '../common/http/request-id.middleware';
import { httpMetricsMiddleware } from '../modules/metrics/http-metrics.middleware';
import { WrapResponseInterceptor } from '../common/http/wrap-response.interceptor';
import { HttpLoggingInterceptor } from '../observability/http-logging.interceptor';

type BootstrapOptions = {
  withSwagger?: boolean;
};

type NodeServerLike = {
  requestTimeout: number;
  headersTimeout: number;
  keepAliveTimeout: number;
};

function applyHttpTimeouts(app: INestApplication, config: AppConfig): void {
  const server = app.getHttpServer() as NodeServerLike | undefined;
  if (!server) return;

  server.requestTimeout = config.http.requestTimeoutMs;
  server.headersTimeout = config.http.headersTimeoutMs;
  server.keepAliveTimeout = config.http.keepAliveTimeoutMs;
}

export function configureApp(
  app: INestApplication,
  config: AppConfig,
  options: BootstrapOptions = {},
): void {
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', config.http.trustProxy);
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  app.use(requestIdMiddleware);
  app.use(httpMetricsMiddleware);
  app.use(helmet());
  app.use(express.json({ limit: config.http.requestBodyLimit }));
  app.use(
    express.urlencoded({ extended: true, limit: config.http.requestBodyLimit }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new HttpLoggingInterceptor(),
    new WrapResponseInterceptor(),
  );

  app.enableCors({
    origin: config.cors.origins,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    exposedHeaders: config.cors.exposedHeaders,
    credentials: config.cors.credentials,
    maxAge: config.cors.maxAgeSeconds,
  });

  if (options.withSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CV Platform API')
      .setVersion('0.1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  applyHttpTimeouts(app, config);
}
