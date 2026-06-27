import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AgingFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class DunningFilterDto {
  @ApiPropertyOptional({ enum: ['active', 'resolved', 'escalated'] })
  @IsOptional()
  @IsIn(['active', 'resolved', 'escalated'])
  status?: string;

  @ApiPropertyOptional({ enum: ['L1', 'L2', 'L3', 'L4'] })
  @IsOptional()
  @IsIn(['L1', 'L2', 'L3', 'L4'])
  level?: string;
}
