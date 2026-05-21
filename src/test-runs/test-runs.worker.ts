import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TestRunsRepository } from './test-runs.repository';

@Injectable()
export class TestRunsWorker {
  private isProcessing = false;

  constructor(private readonly testRunsRepository: TestRunsRepository) {}

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

      await this.runSimulation();

      testRun.complete(new Date().toISOString());
      await this.testRunsRepository.save(testRun);
    } finally {
      this.isProcessing = false;
    }
  }

  private async runSimulation(): Promise<void> {
    return Promise.resolve();
  }
}
