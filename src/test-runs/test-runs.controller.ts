import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import {
  CreateTestRunResponseDto,
  TestRunResponseDto,
  TestRunResultResponseDto,
  TestRunSummaryResponseDto,
} from './dto/test-run-response.dto';
import { TestRunsService } from './test-runs.service';

@ApiTags('test-runs')
@Controller('test-runs')
export class TestRunsController {
  constructor(private readonly testRunsService: TestRunsService) {}

  @Post()
  @ApiOperation({ summary: '테스트 실행 생성' })
  @ApiCreatedResponse({
    description: '테스트 실행 생성 성공',
    type: CreateTestRunResponseDto,
  })
  @ApiBadRequestResponse({ description: '요청 값 검증 실패' })
  create(@Body() createTestRunDto: CreateTestRunDto) {
    return this.testRunsService.create(createTestRunDto);
  }

  @Get()
  @ApiOperation({ summary: '테스트 실행 목록 조회' })
  @ApiOkResponse({
    description: '테스트 실행 목록 조회 성공',
    type: [TestRunSummaryResponseDto],
  })
  findAll() {
    return this.testRunsService.findAll();
  }

  @Get(':testRunId')
  @ApiOperation({ summary: '테스트 실행 상세 조회' })
  @ApiParam({
    name: 'testRunId',
    type: Number,
    description: '조회할 테스트 실행 ID',
    example: 1,
  })
  @ApiOkResponse({
    description: '테스트 실행 상세 조회 성공',
    type: TestRunResponseDto,
  })
  @ApiNotFoundResponse({ description: '테스트 실행을 찾을 수 없음' })
  findById(@Param('testRunId', ParseIntPipe) testRunId: number) {
    return this.testRunsService.findById(testRunId);
  }

  @Get(':testRunId/result')
  @ApiOperation({ summary: '테스트 실행 결과 조회' })
  @ApiParam({
    name: 'testRunId',
    type: Number,
    description: '결과를 조회할 테스트 실행 ID',
    example: 1,
  })
  @ApiOkResponse({
    description: '테스트 실행 결과 조회 성공',
    type: TestRunResultResponseDto,
  })
  @ApiNotFoundResponse({ description: '테스트 실행 또는 결과를 찾을 수 없음' })
  findResult(@Param('testRunId', ParseIntPipe) testRunId: number) {
    return this.testRunsService.findResult(testRunId);
  }
}
