import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUrl, Min } from 'class-validator';

export class CreateTestRunDto {
  @ApiProperty({
    example: 'login-stress-test',
    description: '테스트 시나리오 이름',
  })
  @IsString({ message: '시나리오 이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '시나리오 이름은 필수입니다.' })
  scenarioName!: string;

  @ApiProperty({
    example: 'https://example.com/api/login',
    description: '부하 테스트 대상 URL',
  })
  @IsString({ message: '대상 URL은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '대상 URL은 필수입니다.' })
  @IsUrl({}, { message: '대상 URL 형식이 올바르지 않습니다.' })
  targetUrl!: string;

  @ApiProperty({
    example: 50,
    minimum: 1,
    description: '가상 사용자 수',
  })
  @Type(() => Number)
  @IsInt({ message: '가상 사용자 수는 정수여야 합니다.' })
  @Min(1, { message: '가상 사용자 수는 1 이상이어야 합니다.' })
  virtualUsers!: number;

  @ApiProperty({
    example: 60,
    minimum: 1,
    description: '테스트 지속 시간(초)',
  })
  @Type(() => Number)
  @IsInt({ message: '테스트 지속 시간은 정수여야 합니다.' })
  @Min(1, { message: '테스트 지속 시간은 1초 이상이어야 합니다.' })
  durationSec!: number;

  @ApiProperty({
    example: 10,
    minimum: 1,
    description: '램프업 시간(초)',
  })
  @Type(() => Number)
  @IsInt({ message: '램프업 시간은 정수여야 합니다.' })
  @Min(1, { message: '램프업 시간은 1초 이상이어야 합니다.' })
  rampUpSec!: number;
}
