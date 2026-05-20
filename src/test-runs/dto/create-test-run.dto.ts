import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUrl, Min } from 'class-validator';

export class CreateTestRunDto {
  @ApiProperty({
    example: 'login-stress-test',
    description: '테스트 시나리오 이름',
  })
  @IsString()
  @IsNotEmpty()
  scenarioName!: string;

  @ApiProperty({
    example: 'https://example.com/api/login',
    description: '부하 테스트 대상 URL',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  targetUrl!: string;

  @ApiProperty({
    example: 50,
    minimum: 1,
    description: '가상 사용자 수',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  virtualUsers!: number;

  @ApiProperty({
    example: 60,
    minimum: 1,
    description: '테스트 지속 시간(초)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSec!: number;

  @ApiProperty({
    example: 10,
    minimum: 1,
    description: '램프업 시간(초)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rampUpSec!: number;
}
