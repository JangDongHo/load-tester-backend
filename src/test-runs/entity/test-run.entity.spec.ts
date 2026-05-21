import { TestRunStatus } from '../enum/test-run-status.enum';
import { TestRun } from './test-run.entity';

describe('TestRun', () => {
  it('starts a pending test run', () => {
    const testRun = createTestRun(TestRunStatus.PENDING);

    testRun.start('2026-05-20T14:00:01.000Z');

    expect(testRun.status).toBe(TestRunStatus.RUNNING);
    expect(testRun.startedAt).toBe('2026-05-20T14:00:01.000Z');
  });

  it('completes a running test run', () => {
    const testRun = createTestRun(TestRunStatus.RUNNING);

    testRun.complete('2026-05-20T14:01:01.000Z');

    expect(testRun.status).toBe(TestRunStatus.SUCCESS);
    expect(testRun.finishedAt).toBe('2026-05-20T14:01:01.000Z');
  });

  it('throws when starting a test run that is not pending', () => {
    const testRun = createTestRun(TestRunStatus.RUNNING);

    expect(() => testRun.start('2026-05-20T14:00:01.000Z')).toThrow(
      'Only pending test runs can be started',
    );
  });

  it('throws when completing a test run that is not running', () => {
    const testRun = createTestRun(TestRunStatus.PENDING);

    expect(() => testRun.complete('2026-05-20T14:01:01.000Z')).toThrow(
      'Only running test runs can be completed',
    );
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
