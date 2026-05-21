import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { TestRunsController } from './test-runs.controller';
import { TestRunsRepository } from './test-runs.repository';
import { TestRunsService } from './test-runs.service';
import { TestRunsWorker } from './test-runs.worker';
import { TestRunResult } from './entity/test-run-result.entity';
import { TestRun } from './entity/test-run.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'better-sqlite3',
        database:
          process.env.SQLITE_DATABASE_PATH ??
          join(process.cwd(), 'load-tester.sqlite'),
        entities: [TestRun, TestRunResult],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([TestRun, TestRunResult]),
    ScheduleModule.forRoot(),
  ],
  controllers: [TestRunsController],
  providers: [TestRunsService, TestRunsRepository, TestRunsWorker],
})
export class TestRunsModule {}
