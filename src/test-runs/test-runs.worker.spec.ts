import { TestRun } from './entity/test-run.entity';
import { TestRunStatus } from './enum/test-run-status.enum';
import { TestRunParquetService } from './test-run-parquet.service';
import { TestRunsRepository } from './test-runs.repository';
import { TestRunsWorker } from './test-runs.worker';

describe('TestRunsWorker', () => {
  let repository: jest.Mocked<
    Pick<TestRunsRepository, 'findOldestPending' | 'save' | 'saveResult'>
  >;
  let parquetService: jest.Mocked<
    Pick<TestRunParquetService, 'writeRequestLogsAndAggregate'>
  >;
  let worker: TestRunsWorker;

  beforeEach(() => {
    repository = {
      findOldestPending: jest.fn(),
      save: jest.fn(),
      saveResult: jest.fn(),
    };
    parquetService = {
      writeRequestLogsAndAggregate: jest.fn(),
    };
    worker = new TestRunsWorker(
      repository as unknown as TestRunsRepository,
      parquetService as unknown as TestRunParquetService,
    );
  });

  it('대기 중인 테스트 실행이 없으면 아무 작업도 하지 않는다', async () => {
    repository.findOldestPending.mockResolvedValue(null);

    await worker.handlePendingTestRun();

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('실행 상태를 저장한 뒤 성공 상태를 저장한다', async () => {
    const testRun = createTestRun(TestRunStatus.PENDING);
    const savedStatuses: TestRunStatus[] = [];
    repository.findOldestPending.mockResolvedValue(testRun);
    repository.save.mockImplementation((savedTestRun) => {
      savedStatuses.push(savedTestRun.status);
      return Promise.resolve(savedTestRun);
    });
    parquetService.writeRequestLogsAndAggregate.mockResolvedValue({
      testRunId: 1,
      totalRequests: 60,
      successCount: 58,
      failureCount: 2,
      averageLatencyMs: 120,
      p95LatencyMs: 200,
      maxLatencyMs: 250,
      failureSummary: [{ reason: 'SIMULATED_5XX', count: 2 }],
    });

    await worker.handlePendingTestRun();

    expect(parquetService.writeRequestLogsAndAggregate).toHaveBeenCalledWith(
      testRun,
      expect.arrayContaining([
        expect.objectContaining({
          testRunId: 1,
          requestIndex: 1,
          virtualUserId: 1,
          success: true,
        }),
      ]),
    );
    expect(repository.saveResult).toHaveBeenCalledWith({
      testRunId: 1,
      totalRequests: 60,
      successCount: 58,
      failureCount: 2,
      averageLatencyMs: 120,
      p95LatencyMs: 200,
      maxLatencyMs: 250,
      failureSummary: [{ reason: 'SIMULATED_5XX', count: 2 }],
    });
    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(savedStatuses).toEqual([
      TestRunStatus.RUNNING,
      TestRunStatus.SUCCESS,
    ]);
    expect(testRun.startedAt).toEqual(expect.any(String));
    expect(testRun.finishedAt).toEqual(expect.any(String));
  });

  it('테스트 실행 처리 중에는 중복 틱을 건너뛴다', async () => {
    let resolveFindOldestPending: (testRun: TestRun | null) => void;
    const findOldestPendingPromise = new Promise<TestRun | null>((resolve) => {
      resolveFindOldestPending = resolve;
    });
    repository.findOldestPending.mockReturnValue(findOldestPendingPromise);

    const firstTick = worker.handlePendingTestRun();
    await worker.handlePendingTestRun();
    resolveFindOldestPending!(null);
    await firstTick;

    expect(repository.findOldestPending).toHaveBeenCalledTimes(1);
  });

  it('시뮬레이션 결과 저장에 실패하면 실패 상태로 저장한다', async () => {
    const testRun = createTestRun(TestRunStatus.PENDING);
    const savedStatuses: TestRunStatus[] = [];
    repository.findOldestPending.mockResolvedValue(testRun);
    repository.save.mockImplementation((savedTestRun) => {
      savedStatuses.push(savedTestRun.status);
      return Promise.resolve(savedTestRun);
    });
    parquetService.writeRequestLogsAndAggregate.mockRejectedValue(
      new Error('parquet write failed'),
    );

    await worker.handlePendingTestRun();

    expect(repository.saveResult).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(savedStatuses).toEqual([
      TestRunStatus.RUNNING,
      TestRunStatus.FAILED,
    ]);
    expect(testRun.errorMessage).toBe('parquet write failed');
    expect(testRun.finishedAt).toEqual(expect.any(String));
  });

  function createTestRun(status: TestRunStatus): TestRun {
    return Object.assign(new TestRun(), {
      id: 1,
      scenarioName: 'login-stress-test',
      targetUrl: 'https://example.com/api/login',
      virtualUsers: 50,
      durationSec: 60,
      rampUpSec: 10,
      status,
      requestedAt: '2026-05-20T14:00:00.000Z',
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
    });
  }
});
