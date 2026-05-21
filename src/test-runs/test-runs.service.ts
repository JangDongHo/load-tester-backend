import { Injectable, NotFoundException } from '@nestjs/common';
import { roundToOneDecimal } from '../common/utils/number.util';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { TestRunsRepository } from './test-runs.repository';
import { TestRun } from './entity/test-run.entity';
import { FailureSummaryItem } from './type/test-runs.types';

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
    return {
      testRunId: testRun.id,
      scenarioName: testRun.scenarioName,
      targetUrl: testRun.targetUrl,
      virtualUsers: testRun.virtualUsers,
      durationSec: testRun.durationSec,
      rampUpSec: testRun.rampUpSec,
      status: testRun.status,
      requestedAt: testRun.requestedAt,
      startedAt: testRun.startedAt,
      finishedAt: testRun.finishedAt,
      errorMessage: testRun.errorMessage,
    };
  }

  async findResult(testRunId: number) {
    const testRun = await this.getTestRun(testRunId);

    const result =
      await this.testRunsRepository.findResultByTestRunId(testRunId);

    if (!result) {
      throw new NotFoundException('테스트 실행 결과를 찾을 수 없습니다.');
    }

    const failureSummary = JSON.parse(
      result.failureSummaryJson,
    ) as unknown as FailureSummaryItem[];

    return {
      testRunId: testRun.id,
      status: testRun.status,
      totalRequests: result.totalRequests,
      successCount: result.successCount,
      failureCount: result.failureCount,
      averageLatencyMs: roundToOneDecimal(result.averageLatencyMs),
      p95LatencyMs: roundToOneDecimal(result.p95LatencyMs),
      maxLatencyMs: roundToOneDecimal(result.maxLatencyMs),
      failureSummary,
    };
  }

  private async getTestRun(testRunId: number): Promise<TestRun> {
    const testRun = await this.testRunsRepository.findById(testRunId);

    if (!testRun) {
      throw new NotFoundException('테스트 실행을 찾을 수 없습니다.');
    }

    return testRun;
  }
}
