import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class GstReportDto {
  @ApiPropertyOptional({ example: '2025-2026' })
  @IsOptional()
  @IsString()
  financialYear?: string;
}

export class HsnQueryDto {
  @ApiPropertyOptional({ example: '2026-03' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class TdsQueryDto {
  @ApiPropertyOptional({ example: '2026-03' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PnlQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: '2025-2026' })
  @IsOptional()
  @IsString()
  financialYear?: string;
}

export class AuditQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ enum: ['info', 'success', 'warning', 'error'] })
  @IsOptional()
  @IsIn(['info', 'success', 'warning', 'error'])
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
