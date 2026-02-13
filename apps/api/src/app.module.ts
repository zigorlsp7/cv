import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { DbHealthService } from './modules/health/db-health.service';
import { HealthController } from './modules/health/health.controller';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { RequestIdMiddleware } from './observability/request-id.middleware';

const ttl = Number(process.env.RATE_LIMIT_TTL_MS)
const limit = Number(process.env.RATE_LIMIT_LIMIT)

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig), 
    HealthModule, 
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        // Pretty only for local dev if you want:
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              }
            : undefined,
        // Attach request id to each log
        customProps: (req) => ({
          requestId: (req as any).requestId,
        }),
        // Avoid logging noisy endpoints if you want (optional):
        // autoLogging: { ignore: (req) => req.url === '/v1/health' },
      },
    }),
    MetricsModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl, limit },
      ],
    })
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, DbHealthService,  
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*')
  }
}
