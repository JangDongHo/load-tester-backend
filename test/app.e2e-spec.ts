import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
import { AppModule } from './../src/app.module';

interface CreateTestRunResponse {
  testRunId: number;
  status: string;
  requestedAt: string;
}

describe('TestRunsController (e2e)', () => {
  let app: INestApplication;
  let httpServer: App;
  let databasePath: string;

  beforeEach(async () => {
    databasePath = join(
      tmpdir(),
      `load-tester-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`,
    );
    process.env.SQLITE_DATABASE_PATH = databasePath;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
    httpServer = app.getHttpServer() as App;
  });

  afterEach(async () => {
    await app.close();
    delete process.env.SQLITE_DATABASE_PATH;

    try {
      unlinkSync(databasePath);
    } catch {
      // 앱 초기화가 일찍 실패하면 데이터베이스 파일이 없을 수 있다.
    }
  });

  it('대기 중인 테스트 실행을 생성한다', async () => {
    const response = await request(httpServer)
      .post('/test-runs')
      .send({
        scenarioName: 'login-stress-test',
        targetUrl: 'https://example.com/api/login',
        virtualUsers: 50,
        durationSec: 60,
        rampUpSec: 10,
      })
      .expect(201);

    const body = response.body as unknown as CreateTestRunResponse;
    expect(typeof body.testRunId).toBe('number');
    expect(body.status).toBe('PENDING');
    expect(typeof body.requestedAt).toBe('string');
  });

  it('올바르지 않은 생성 요청을 거절한다', async () => {
    const response = await request(httpServer)
      .post('/test-runs')
      .send({
        scenarioName: 'login-stress-test',
        targetUrl: 'not-a-url',
        virtualUsers: 0,
        durationSec: 60,
        rampUpSec: 10,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      message: expect.arrayContaining([
        '대상 URL 형식이 올바르지 않습니다.',
        '가상 사용자 수는 1 이상이어야 합니다.',
      ]),
    });
  });

  it('테스트 실행 목록을 최신 요청 순으로 조회한다', async () => {
    const first = await createTestRun('first-scenario');
    const second = await createTestRun('second-scenario');

    const response = await request(httpServer).get('/test-runs').expect(200);
    const body = response.body as unknown;

    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    const [latest, earliest] = body as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(latest.testRunId).toBe(second);
    expect(latest.scenarioName).toBe('second-scenario');
    expect(latest.status).toBe('PENDING');
    expect(typeof latest.requestedAt).toBe('string');
    expect(earliest.testRunId).toBe(first);
    expect(earliest.scenarioName).toBe('first-scenario');
    expect(earliest.status).toBe('PENDING');
    expect(typeof earliest.requestedAt).toBe('string');
  });

  it('테스트 실행 상세를 조회한다', async () => {
    const testRunId = await createTestRun('detail-scenario');

    const response = await request(httpServer)
      .get(`/test-runs/${testRunId}`)
      .expect(200);
    const body = response.body as unknown;

    expect(body).toMatchObject({
      testRunId,
      scenarioName: 'detail-scenario',
      status: 'PENDING',
      targetUrl: 'https://example.com/api/login',
      virtualUsers: 50,
      durationSec: 60,
      startedAt: null,
      finishedAt: null,
    });
    expect(typeof (body as Record<string, unknown>).requestedAt).toBe('string');
  });

  it('없는 테스트 실행 상세 조회 시 404를 반환한다', async () => {
    const response = await request(httpServer)
      .get('/test-runs/999999')
      .expect(404);

    expect(response.body).toMatchObject({
      message: '테스트 실행을 찾을 수 없습니다.',
    });
  });

  it('테스트 실행 결과가 아직 없으면 404를 반환한다', async () => {
    const testRunId = await createTestRun('pending-result-scenario');

    const response = await request(httpServer)
      .get(`/test-runs/${testRunId}/result`)
      .expect(404);

    expect(response.body).toMatchObject({
      message: '테스트 실행 결과를 찾을 수 없습니다.',
    });
  });

  async function createTestRun(scenarioName: string): Promise<number> {
    const response = await request(httpServer)
      .post('/test-runs')
      .send({
        scenarioName,
        targetUrl: 'https://example.com/api/login',
        virtualUsers: 50,
        durationSec: 60,
        rampUpSec: 10,
      })
      .expect(201);

    const body = response.body as unknown as CreateTestRunResponse;
    return body.testRunId;
  }
});
