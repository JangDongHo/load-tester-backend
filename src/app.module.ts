import { Module } from '@nestjs/common';
import { TestRunsModule } from './test-runs/test-runs.module';

@Module({
  imports: [TestRunsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
