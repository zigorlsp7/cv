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

  it('/v1/cv (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/cv')
      .expect(200)
      .expect(({ body }) => {
        expect(body.ok).toBe(true);
        expect(body.data?.fullName).toBeDefined();
        expect(Array.isArray(body.data?.sections)).toBe(true);
        expect(body.data?.sections).toHaveLength(6);
      });
  });

  it('/v1/cv (PUT)', async () => {
    const payload = {
      fullName: 'Jane Doe',
      role: 'Platform Engineer',
      tagline: 'Builds reliable systems.',
      chips: ['Location: Remote', 'Email: jane@example.com'],
      sections: [
        {
          id: 'profile-summary',
          title: 'Profile Summary',
          summary: 'Short summary',
          bullets: ['Strong backend ownership'],
        },
        {
          id: 'experience-highlights',
          title: 'Experience Highlights',
          summary: 'Most relevant positions and achievements.',
          bullets: ['Drove reliability and delivery improvements'],
        },
        {
          id: 'skills',
          title: 'Skills',
          summary: 'Technical capabilities grouped by category.',
          bullets: ['TypeScript, NestJS, PostgreSQL'],
        },
        {
          id: 'projects',
          title: 'Projects',
          summary: 'Flagship projects that prove execution and ownership.',
          bullets: ['Built and hardened a production-ready web skeleton'],
        },
        {
          id: 'education',
          title: 'Education',
          summary: 'Formal education and certifications.',
          bullets: ['Computer Science degree'],
        },
        {
          id: 'languages',
          title: 'Languages',
          summary: 'Spoken languages and proficiency.',
          bullets: ['English: Professional', 'Spanish: Native'],
        },
      ],
    };

    await request(app.getHttpServer())
      .put('/v1/cv')
      .send(payload)
      .expect(200)
      .expect(({ body }) => {
        expect(body.ok).toBe(true);
        expect(body.data?.fullName).toBe(payload.fullName);
        expect(body.data?.sections?.[0]?.id).toBe('profile-summary');
        expect(body.data?.sections).toHaveLength(6);
      });

    await request(app.getHttpServer())
      .get('/v1/cv')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data?.fullName).toBe(payload.fullName);
      });
  });
});
