import { TestRunStatus } from '../enum/test-run-status.enum';
import { TestRun } from './test-run.entity';

describe('TestRun', () => {
  it('대기 중인 테스트 실행을 시작 상태로 변경한다', () => {
    const testRun = createTestRun(TestRunStatus.PENDING);

    testRun.start('2026-05-20T14:00:01.000Z');

    expect(testRun.status).toBe(TestRunStatus.RUNNING);
    expect(testRun.startedAt).toBe('2026-05-20T14:00:01.000Z');
  });

  it('실행 중인 테스트 실행을 성공 상태로 완료한다', () => {
    const testRun = createTestRun(TestRunStatus.RUNNING);

    testRun.complete('2026-05-20T14:01:01.000Z');

    expect(testRun.status).toBe(TestRunStatus.SUCCESS);
    expect(testRun.finishedAt).toBe('2026-05-20T14:01:01.000Z');
  });

  it('실행 중인 테스트 실행을 실패 상태로 변경한다', () => {
    const testRun = createTestRun(TestRunStatus.RUNNING);

    testRun.fail('network timeout', '2026-05-20T14:01:01.000Z');

    expect(testRun.status).toBe(TestRunStatus.FAILED);
    expect(testRun.errorMessage).toBe('network timeout');
    expect(testRun.finishedAt).toBe('2026-05-20T14:01:01.000Z');
  });

  it('대기 중이 아닌 테스트 실행을 시작하면 예외를 던진다', () => {
    const testRun = createTestRun(TestRunStatus.RUNNING);

    expect(() => testRun.start('2026-05-20T14:00:01.000Z')).toThrow(
      '대기 중인 테스트 실행만 시작할 수 있습니다.',
    );
  });

  it('실행 중이 아닌 테스트 실행을 완료하면 예외를 던진다', () => {
    const testRun = createTestRun(TestRunStatus.PENDING);

    expect(() => testRun.complete('2026-05-20T14:01:01.000Z')).toThrow(
      '실행 중인 테스트 실행만 완료할 수 있습니다.',
    );
  });

  it('실행 중이 아닌 테스트 실행을 실패 처리하면 예외를 던진다', () => {
    const testRun = createTestRun(TestRunStatus.PENDING);

    expect(() =>
      testRun.fail('network timeout', '2026-05-20T14:01:01.000Z'),
    ).toThrow('실행 중인 테스트 실행만 실패 처리할 수 있습니다.');
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
