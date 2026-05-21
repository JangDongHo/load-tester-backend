import { TestRunsRepository } from './test-runs.repository';
import { TestRunsService } from './test-runs.service';
import { TestRun } from './entity/test-run.entity';
import { TestRunResult } from './entity/test-run-result.entity';
import { TestRunStatus } from './enum/test-run-status.enum';

describe('TestRunsService', () => {
  let repository: jest.Mocked<
    Pick<
      TestRunsRepository,
      'create' | 'findAll' | 'findById' | 'findResultByTestRunId'
    >
  >;
  let service: TestRunsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findResultByTestRunId: jest.fn(),
    };
    service = new TestRunsService(repository as unknown as TestRunsRepository);
  });

  it('대기 중인 테스트 실행을 생성한다', async () => {
    repository.create.mockResolvedValue(createTestRun());

    const response = await service.create({
      scenarioName: 'login-stress-test',
      targetUrl: 'https://example.com/api/login',
      virtualUsers: 50,
      durationSec: 60,
      rampUpSec: 10,
    });

    expect(response).toEqual({
      testRunId: 1,
      status: 'PENDING',
      requestedAt: '2026-05-20T14:00:00.000Z',
    });
    expect(repository.create).toHaveBeenCalledWith(
      {
        scenarioName: 'login-stress-test',
        targetUrl: 'https://example.com/api/login',
        virtualUsers: 50,
        durationSec: 60,
        rampUpSec: 10,
      },
      expect.any(String),
    );
  });

  it('테스트 실행이 없으면 찾을 수 없음 예외를 던진다', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findById(999999)).rejects.toThrow(
      '테스트 실행을 찾을 수 없습니다.',
    );
  });

  it('결과가 아직 없으면 찾을 수 없음 예외를 던진다', async () => {
    repository.findById.mockResolvedValue(createTestRun());
    repository.findResultByTestRunId.mockResolvedValue(null);

    await expect(service.findResult(1)).rejects.toThrow(
      '테스트 실행 결과를 찾을 수 없습니다.',
    );
  });

  it('테스트 실행 결과의 지연 시간을 소수점 한 자리로 반올림한다', async () => {
    repository.findById.mockResolvedValue(createTestRun());
    repository.findResultByTestRunId.mockResolvedValue(
      Object.assign(new TestRunResult(), {
        id: 1,
        testRunId: 1,
        totalRequests: 100,
        successCount: 96,
        failureCount: 4,
        averageLatencyMs: 189.42666666666668,
        p95LatencyMs: 288,
        maxLatencyMs: 299,
        failureSummaryJson: JSON.stringify([
          { reason: 'SIMULATED_5XX', count: 4 },
        ]),
      }),
    );

    const response = await service.findResult(1);

    expect(response).toMatchObject({
      averageLatencyMs: 189.4,
      p95LatencyMs: 288,
      maxLatencyMs: 299,
    });
  });

  function createTestRun(): TestRun {
    return Object.assign(new TestRun(), {
      id: 1,
      scenarioName: 'login-stress-test',
      targetUrl: 'https://example.com/api/login',
      virtualUsers: 50,
      durationSec: 60,
      rampUpSec: 10,
      status: TestRunStatus.PENDING,
      requestedAt: '2026-05-20T14:00:00.000Z',
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
    });
  }
});
