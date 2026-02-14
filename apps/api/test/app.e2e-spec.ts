import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { configureApp } from '../src/bootstrap/app-bootstrap';
import { config } from '../src/config/app.config';
import { truncateTestTables } from './support/db-cleanup';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  jest.setTimeout(30_000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, config);
    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await truncateTestTables(dataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body.ok).toBe(true);
        expect(body.data).toBe('Hello World!');
        expect(typeof body.requestId).toBe('string');
      });
  });

  it('/v1/health/live (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health/live')
      .expect(200)
      .expect(({ body }) => {
        expect(body.ok).toBe(true);
        expect(body.data?.status).toBe('ok');
      });
  });

  it('/v1/health/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health/ready')
      .expect(200)
      .expect(({ body }) => {
        expect(body.ok).toBe(true);
        expect(body.data?.status).toBe('ok');
        expect(body.data?.db?.ok).toBe(true);
      });
  });

  it('/v1/feature-flags (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/feature-flags')
      .expect(200)
      .expect(({ body }) => {
        expect(body.ok).toBe(true);
        expect(body.data?.swagger_docs).toBeDefined();
        expect(body.data?.rum_ingest).toBeDefined();
      });
  });

  it('/v1/rum/events (POST)', () => {
    return request(app.getHttpServer())
      .post('/v1/rum/events')
      .send({
        events: [{ type: 'navigation', path: '/', release: 'test' }],
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.ok).toBe(true);
        expect(body.data?.accepted).toBe(1);
      });
  });
});
