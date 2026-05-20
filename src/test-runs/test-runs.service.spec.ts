import { NotFoundException } from '@nestjs/common';
import { TestRunsRepository } from './test-runs.repository';
import { TestRunsService } from './test-runs.service';
import { TestRun } from './entity/test-run.entity';

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

  it('creates a pending test run', async () => {
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

  it('throws not found when a test run does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findById(999999)).rejects.toThrow(NotFoundException);
  });

  it('throws not found when a result does not exist yet', async () => {
    repository.findById.mockResolvedValue(createTestRun());
    repository.findResultByTestRunId.mockResolvedValue(null);

    await expect(service.findResult(1)).rejects.toThrow(NotFoundException);
  });

  function createTestRun(): TestRun {
    return {
      id: 1,
      scenarioName: 'login-stress-test',
      targetUrl: 'https://example.com/api/login',
      virtualUsers: 50,
      durationSec: 60,
      rampUpSec: 10,
      status: 'PENDING',
      requestedAt: '2026-05-20T14:00:00.000Z',
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
    };
  }
});
