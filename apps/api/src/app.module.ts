import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config } from './config/app.config';
import { typeOrmConfig } from './config/typeorm.config';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { AsyncModule } from './modules/async/async.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { RumModule } from './modules/rum/rum.module';
import { ArchitectureModule } from './modules/architecture/architecture.module';
import { CvModule } from './modules/cv/cv.module';
import { getOtelIds } from './observability/otel-log-context';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    HealthModule,
    AsyncModule,
    FeatureFlagsModule,
    RumModule,
    ArchitectureModule,
    CvModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: config.logLevel,
        transport:
          config.nodeEnv !== 'production'
            ? {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              }
            : undefined,

        customProps: (req, res) => ({
          requestId:
            (res?.getHeader?.('x-request-id') as string | undefined) ||
            (req.headers['x-request-id'] as string | undefined) ||
            (req as any).requestId,
          ...getOtelIds(),
        }),
      },
    }),
    MetricsModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: config.rateLimit.ttlMs, limit: config.rateLimit.limit },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
