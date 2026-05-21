import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { TestRun } from './entity/test-run.entity';
import { TestRunResult } from './entity/test-run-result.entity';
import { TestRunStatus } from './enum/test-run-status.enum';
import { TestRunResultInput } from './type/test-runs.types';

@Injectable()
export class TestRunsRepository {
  constructor(
    @InjectRepository(TestRun)
    private readonly testRunRepository: Repository<TestRun>,
    @InjectRepository(TestRunResult)
    private readonly testRunResultRepository: Repository<TestRunResult>,
  ) {}

  async create(input: CreateTestRunDto, requestedAt: string): Promise<TestRun> {
    const testRun = this.testRunRepository.create({
      scenarioName: input.scenarioName,
      targetUrl: input.targetUrl,
      virtualUsers: input.virtualUsers,
      durationSec: input.durationSec,
      rampUpSec: input.rampUpSec,
      status: TestRunStatus.PENDING,
      requestedAt,
    });

    const savedTestRun = await this.testRunRepository.save(testRun);

    return savedTestRun;
  }

  async findAll(): Promise<TestRun[]> {
    const testRuns = await this.testRunRepository.find({
      order: {
        requestedAt: 'DESC',
        id: 'DESC',
      },
    });

    return testRuns;
  }

  async findById(id: number): Promise<TestRun | null> {
    const testRun = await this.testRunRepository.findOneBy({ id });
    return testRun;
  }

  async findOldestPending(): Promise<TestRun | null> {
    const testRun = await this.testRunRepository.findOne({
      where: {
        status: TestRunStatus.PENDING,
      },
      order: {
        requestedAt: 'ASC',
        id: 'ASC',
      },
    });

    return testRun;
  }

  async save(testRun: TestRun): Promise<TestRun> {
    const savedTestRun = await this.testRunRepository.save(testRun);
    return savedTestRun;
  }

  async saveResult(input: TestRunResultInput): Promise<TestRunResult> {
    const testRunResult = this.testRunResultRepository.create({
      testRunId: input.testRunId,
      totalRequests: input.totalRequests,
      successCount: input.successCount,
      failureCount: input.failureCount,
      averageLatencyMs: input.averageLatencyMs,
      p95LatencyMs: input.p95LatencyMs,
      maxLatencyMs: input.maxLatencyMs,
      failureSummaryJson: JSON.stringify(input.failureSummary),
    });

    const savedTestRunResult =
      await this.testRunResultRepository.save(testRunResult);
    return savedTestRunResult;
  }

  async findResultByTestRunId(
    testRunId: number,
  ): Promise<TestRunResult | null> {
    const result = await this.testRunResultRepository.findOne({
      where: {
        testRunId,
      },
    });

    return result;
  }
}
