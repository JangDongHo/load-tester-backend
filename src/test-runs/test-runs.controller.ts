import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { TestRunsService } from './test-runs.service';

@Controller('test-runs')
export class TestRunsController {
  constructor(private readonly testRunsService: TestRunsService) {}

  @Post()
  create(@Body() createTestRunDto: CreateTestRunDto) {
    return this.testRunsService.create(createTestRunDto);
  }

  @Get()
  findAll() {
    return this.testRunsService.findAll();
  }

  @Get(':testRunId')
  findById(@Param('testRunId', ParseIntPipe) testRunId: number) {
    return this.testRunsService.findById(testRunId);
  }

  @Get(':testRunId/result')
  findResult(@Param('testRunId', ParseIntPipe) testRunId: number) {
    return this.testRunsService.findResult(testRunId);
  }
}
