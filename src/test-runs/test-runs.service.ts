import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { TestRunsRepository } from './test-runs.repository';
import { TestRun } from './entity/test-run.entity';

@Injectable()
export class TestRunsService {
  constructor(private readonly testRunsRepository: TestRunsRepository) {}

  async create(createTestRunDto: CreateTestRunDto) {
    const testRun = await this.testRunsRepository.create(
      createTestRunDto,
      new Date().toISOString(),
    );

    return {
      testRunId: testRun.id,
      status: testRun.status,
      requestedAt: testRun.requestedAt,
    };
  }

  async findAll() {
    const testRuns = await this.testRunsRepository.findAll();

    return testRuns.map((testRun) => ({
      testRunId: testRun.id,
      scenarioName: testRun.scenarioName,
      status: testRun.status,
      requestedAt: testRun.requestedAt,
    }));
  }

  async findById(testRunId: number) {
    const testRun = await this.getTestRun(testRunId);
    return testRun;
  }

  async findResult(testRunId: number) {
    const testRun = await this.getTestRun(testRunId);

    const result =
      await this.testRunsRepository.findResultByTestRunId(testRunId);

    if (!result) {
      throw new NotFoundException('Test run result not found');
    }

    return {
      testRunId: testRun.id,
      status: testRun.status,
      totalRequests: result.totalRequests,
      successCount: result.successCount,
      failureCount: result.failureCount,
      averageLatencyMs: result.averageLatencyMs,
      p95LatencyMs: result.p95LatencyMs,
      maxLatencyMs: result.maxLatencyMs,
      failureSummary: null,
    };
  }

  private async getTestRun(testRunId: number): Promise<TestRun> {
    const testRun = await this.testRunsRepository.findById(testRunId);

    if (!testRun) {
      throw new NotFoundException('Test run not found');
    }

    return testRun;
  }
}
