import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/app-bootstrap';
import { config } from './config/app.config';
import './observability/tracing';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app, config, {
    withSwagger: config.swagger.enabled,
  });
  await app.listen(config.port);
}
bootstrap();
