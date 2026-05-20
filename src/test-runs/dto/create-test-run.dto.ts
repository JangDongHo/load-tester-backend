import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUrl, Min } from 'class-validator';

export class CreateTestRunDto {
  @IsString()
  @IsNotEmpty()
  scenarioName!: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  targetUrl!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  virtualUsers!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSec!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  rampUpSec!: number;
}
