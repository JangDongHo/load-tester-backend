import duckdb from '@duckdb/node-api';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TestRun } from './entity/test-run.entity';
import { TestRunStatus } from './enum/test-run-status.enum';
import { TestRunParquetService } from './test-run-parquet.service';
import { TestRunRequestLog } from './type/test-runs.types';

describe('TestRunParquetService', () => {
  let originalParquetDir: string | undefined;
  let parquetRoot: string;
  let service: TestRunParquetService;

  beforeEach(async () => {
    originalParquetDir = process.env.TEST_RUN_PARQUET_DIR;
    parquetRoot = await mkdtemp(join(tmpdir(), 'load-tester-parquet-'));
    process.env.TEST_RUN_PARQUET_DIR = parquetRoot;
    service = new TestRunParquetService();
  });

  afterEach(async () => {
    if (originalParquetDir === undefined) {
      delete process.env.TEST_RUN_PARQUET_DIR;
    } else {
      process.env.TEST_RUN_PARQUET_DIR = originalParquetDir;
    }

    await rm(parquetRoot, { recursive: true, force: true });
  });

  it('요청 로그를 Parquet으로 저장하고 집계 결과를 반환한다', async () => {
    const testRun = createTestRun();
    const requestLogs: TestRunRequestLog[] = [
      createRequestLog({ requestIndex: 1, latencyMs: 100, success: true }),
      createRequestLog({ requestIndex: 2, latencyMs: 200, success: true }),
      createRequestLog({ requestIndex: 3, latencyMs: 201, success: true }),
      createRequestLog({
        requestIndex: 4,
        latencyMs: 300,
        success: false,
        statusCode: 500,
        errorMessage: 'SIMULATED_5XX',
      }),
    ];

    const result = await service.writeRequestLogsAndAggregate(
      testRun,
      requestLogs,
    );

    expect(result).toEqual({
      testRunId: 1,
      totalRequests: 4,
      successCount: 3,
      failureCount: 1,
      averageLatencyMs: 200.25,
      p95LatencyMs: 285.15,
      maxLatencyMs: 300,
      failureSummary: [{ reason: 'SIMULATED_5XX', count: 1 }],
    });

    const instance = await duckdb.DuckDBInstance.create(':memory:');
    const connection = await instance.connect();

    try {
      const parquetPath = service.getParquetPath(testRun.id);
      const readResult = await connection.run(
        `SELECT count(*) AS row_count, min(request_index) AS first_index
         FROM read_parquet('${parquetPath.replaceAll("'", "''")}')`,
      );
      const [row] = await readResult.getRowObjectsJS();

      expect(row).toEqual({
        row_count: 4n,
        first_index: 1,
      });
    } finally {
      connection.closeSync();
    }
  });

  function createTestRun(): TestRun {
    return Object.assign(new TestRun(), {
      id: 1,
      scenarioName: 'login-stress-test',
      targetUrl: 'https://example.com/api/login',
      virtualUsers: 3,
      durationSec: 1,
      rampUpSec: 1,
      status: TestRunStatus.RUNNING,
      requestedAt: '2026-05-20T14:00:00.000Z',
      startedAt: '2026-05-20T14:00:01.000Z',
      finishedAt: null,
      errorMessage: null,
    });
  }

  function createRequestLog(
    override: Partial<TestRunRequestLog>,
  ): TestRunRequestLog {
    const requestIndex = override.requestIndex ?? 1;
    const latencyMs = override.latencyMs ?? 100;

    return {
      testRunId: 1,
      requestIndex,
      virtualUserId: requestIndex,
      startedAt: `2026-05-20T14:00:0${requestIndex}.000Z`,
      finishedAt: `2026-05-20T14:00:0${requestIndex}.${latencyMs}Z`,
      latencyMs,
      statusCode: 200,
      success: true,
      errorMessage: null,
      ...override,
    };
  }
});
