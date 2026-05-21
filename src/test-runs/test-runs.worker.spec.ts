import { TestRun } from './entity/test-run.entity';
import { TestRunStatus } from './enum/test-run-status.enum';
import { TestRunsRepository } from './test-runs.repository';
import { TestRunsWorker } from './test-runs.worker';

describe('TestRunsWorker', () => {
  let repository: jest.Mocked<
    Pick<TestRunsRepository, 'findOldestPending' | 'save'>
  >;
  let worker: TestRunsWorker;

  beforeEach(() => {
    repository = {
      findOldestPending: jest.fn(),
      save: jest.fn(),
    };
    worker = new TestRunsWorker(repository as unknown as TestRunsRepository);
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
    repository.save.mockImplementation(async (savedTestRun) => {
      savedStatuses.push(savedTestRun.status);
      return savedTestRun;
    });

    await worker.handlePendingTestRun();

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
