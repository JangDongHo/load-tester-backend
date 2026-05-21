import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TestRun } from './entity/test-run.entity';
import { TestRunParquetService } from './test-run-parquet.service';
import { TestRunsRepository } from './test-runs.repository';
import { TestRunRequestLog } from './type/test-runs.types';

@Injectable()
export class TestRunsWorker {
  private isProcessing = false;

  constructor(
    private readonly testRunsRepository: TestRunsRepository,
    private readonly testRunParquetService: TestRunParquetService,
  ) {}

  @Interval(1000)
  async handlePendingTestRun(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const testRun = await this.testRunsRepository.findOldestPending();

      if (!testRun) {
        return;
      }

      testRun.start(new Date().toISOString());
      await this.testRunsRepository.save(testRun);

      try {
        const requestLogs = this.runSimulation(testRun);
        const result =
          await this.testRunParquetService.writeRequestLogsAndAggregate(
            testRun,
            requestLogs,
          );
        await this.testRunsRepository.saveResult(result);

        testRun.complete(new Date().toISOString());
        await this.testRunsRepository.save(testRun);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.';
        testRun.fail(errorMessage, new Date().toISOString());
        await this.testRunsRepository.save(testRun);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private runSimulation(testRun: TestRun): TestRunRequestLog[] {
    const totalRequests = testRun.virtualUsers * testRun.durationSec;
    const startedAtBase = testRun.startedAt
      ? new Date(testRun.startedAt).getTime()
      : Date.now();

    return Array.from({ length: totalRequests }, (_, index) => {
      const latencyMs = 80 + ((index * 17 + testRun.virtualUsers) % 220);
      const isFailure = (index + 1) % 25 === 0;
      const startedAt = new Date(startedAtBase + index * 100).toISOString();
      const finishedAt = new Date(
        startedAtBase + index * 100 + latencyMs,
      ).toISOString();

      return {
        testRunId: testRun.id,
        requestIndex: index + 1,
        virtualUserId: (index % testRun.virtualUsers) + 1,
        startedAt,
        finishedAt,
        latencyMs,
        statusCode: isFailure ? 500 : 200,
        success: !isFailure,
        errorMessage: isFailure ? 'SIMULATED_5XX' : null,
      };
    });
  }
}
