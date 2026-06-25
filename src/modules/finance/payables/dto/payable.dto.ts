import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class VendorBillFilterDto {
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'paid', 'overdue'] })
  @IsOptional()
  @IsIn(['pending', 'approved', 'paid', 'overdue'])
  status?: string;

  @ApiPropertyOptional({ enum: ['critical', 'high', 'medium', 'low'] })
  @IsOptional()
  @IsIn(['critical', 'high', 'medium', 'low'])
  priority?: string;

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

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UploadBillDto {
  @ApiProperty()
  @IsUUID()
  vendorId!: string;

  @ApiProperty()
  @IsString()
  billNumber!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gstAmount!: number;

  @ApiProperty()
  @IsDateString()
  billDate!: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiPropertyOptional({ enum: ['critical', 'high', 'medium', 'low'] })
  @IsOptional()
  @IsIn(['critical', 'high', 'medium', 'low'])
  priority?: string;
}

export class ApprovePayoutDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids!: string[];
}

export class DisbursePayoutDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids!: string[];
}
