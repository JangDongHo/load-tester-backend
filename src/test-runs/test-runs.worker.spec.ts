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

  it('does nothing when there is no pending test run', async () => {
    repository.findOldestPending.mockResolvedValue(null);

    await worker.handlePendingTestRun();

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('saves running status before saving success status', async () => {
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

  it('skips duplicated ticks while a test run is being processed', async () => {
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
