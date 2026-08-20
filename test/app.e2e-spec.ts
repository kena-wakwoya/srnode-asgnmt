import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';
import { setupSwagger } from './../src/swagger';

describe('Bootstrap (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureHttp(app);
    setupSwagger(app);
    await app.init();
  });

  it('/docs (GET) serves Swagger UI', () => {
    return request(app.getHttpServer()).get('/docs').expect(200);
  });

  it('unknown routes return the structured error envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/does-not-exist')
      .set('x-request-id', 'req-test-1')
      .expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        requestId: 'req-test-1',
      },
    });
    expect(response.headers['x-request-id']).toBe('req-test-1');
    expect(JSON.stringify(response.body)).not.toMatch(/stack/i);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
