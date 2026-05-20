import { ApiProperty } from '@nestjs/swagger';
import { TestRunStatus } from '../enum/test-run-status.enum';

export class CreateTestRunResponseDto {
  @ApiProperty({ example: 1, description: '생성된 테스트 실행 ID' })
  testRunId!: number;

  @ApiProperty({
    enum: TestRunStatus,
    example: 'PENDING',
    description: '테스트 실행 상태',
  })
  status!: TestRunStatus;

  @ApiProperty({
    example: '2026-05-20T14:00:00.000Z',
    description: '테스트 실행 요청 시각',
  })
  requestedAt!: string;
}

export class TestRunSummaryResponseDto extends CreateTestRunResponseDto {
  @ApiProperty({
    example: 'login-stress-test',
    description: '테스트 시나리오 이름',
  })
  scenarioName!: string;
}

export class TestRunResponseDto {
  @ApiProperty({ example: 1, description: '테스트 실행 ID' })
  id!: number;

  @ApiProperty({
    example: 'login-stress-test',
    description: '테스트 시나리오 이름',
  })
  scenarioName!: string;

  @ApiProperty({
    example: 'https://example.com/api/login',
    description: '부하 테스트 대상 URL',
  })
  targetUrl!: string;

  @ApiProperty({ example: 50, description: '가상 사용자 수' })
  virtualUsers!: number;

  @ApiProperty({ example: 60, description: '테스트 지속 시간(초)' })
  durationSec!: number;

  @ApiProperty({ example: 10, description: '램프업 시간(초)' })
  rampUpSec!: number;

  @ApiProperty({
    enum: TestRunStatus,
    example: 'PENDING',
    description: '테스트 실행 상태',
  })
  status!: TestRunStatus;

  @ApiProperty({
    example: '2026-05-20T14:00:00.000Z',
    description: '테스트 실행 요청 시각',
  })
  requestedAt!: string;

  @ApiProperty({
    example: null,
    nullable: true,
    description: '테스트 시작 시각',
  })
  startedAt!: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
    description: '테스트 종료 시각',
  })
  finishedAt!: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
    description: '테스트 실패 에러 메시지',
  })
  errorMessage!: string | null;
}

export class FailureSummaryItemResponseDto {
  @ApiProperty({ example: 'ECONNRESET', description: '실패 사유' })
  reason!: string;

  @ApiProperty({ example: 3, description: '실패 횟수' })
  count!: number;
}

export class TestRunResultResponseDto {
  @ApiProperty({ example: 1, description: '테스트 실행 ID' })
  testRunId!: number;

  @ApiProperty({
    enum: TestRunStatus,
    example: 'SUCCESS',
    description: '테스트 실행 상태',
  })
  status!: TestRunStatus;

  @ApiProperty({ example: 1000, description: '전체 요청 수' })
  totalRequests!: number;

  @ApiProperty({ example: 980, description: '성공 요청 수' })
  successCount!: number;

  @ApiProperty({ example: 20, description: '실패 요청 수' })
  failureCount!: number;

  @ApiProperty({ example: 123.45, description: '평균 지연 시간(ms)' })
  averageLatencyMs!: number;

  @ApiProperty({ example: 250.1, description: '95 퍼센타일 지연 시간(ms)' })
  p95LatencyMs!: number;

  @ApiProperty({ example: 500.2, description: '최대 지연 시간(ms)' })
  maxLatencyMs!: number;

  @ApiProperty({
    type: [FailureSummaryItemResponseDto],
    nullable: true,
    example: null,
    description: '실패 사유별 요약',
  })
  failureSummary!: FailureSummaryItemResponseDto[] | null;
}
