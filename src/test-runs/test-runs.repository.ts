import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { TestRun } from './entity/test-run.entity';
import { TestRunResult } from './entity/test-run-result.entity';
import { TestRunStatus } from './enum/test-run-status.enum';

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
