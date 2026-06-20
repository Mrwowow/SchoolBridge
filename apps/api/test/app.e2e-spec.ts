import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SchoolBridge API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({ status: expect.stringMatching(/^(ok|degraded)$/) });
  });

  it('POST /auth/register returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Test User',
        phone: '08099990001',
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('POST /auth/login rejects wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: '08099990001', password: 'wrong' })
      .expect(401);
  });
});
