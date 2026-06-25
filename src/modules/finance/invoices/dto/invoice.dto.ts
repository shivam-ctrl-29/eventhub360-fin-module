import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMode } from '../../../../common/enums';

export class CreateLineItemDto {
  @ApiProperty({ example: 'Premium Venue Decoration', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  description: string;

  @ApiProperty({ example: 1, minimum: 0.01, maximum: 99999 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999)
  quantity: number;

  @ApiProperty({ example: 75000, minimum: 0.01, maximum: 9999999 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9999999)
  unitPrice: number;

  @ApiProperty({
    example: 18,
    description: 'GST rate — must be 0, 5, 12, 18, or 28',
    enum: [0, 5, 12, 18, 28],
  })
  @IsIn([0, 5, 12, 18, 28], {
    message: 'gstRate must be one of: 0, 5, 12, 18, 28',
  })
  gstRate: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'uuid-customer-id' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ type: [CreateLineItemDto], minItems: 1, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1, { message: 'Invoice must have at least 1 line item' })
  @ArrayMaxSize(50, { message: 'Invoice cannot have more than 50 line items' })
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems: CreateLineItemDto[];

  @ApiPropertyOptional({ enum: PaymentMode })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({ example: 'Internal notes', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: 'Payment due within 30 days', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  terms?: string;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ type: [CreateLineItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems?: CreateLineItemDto[];

  @ApiPropertyOptional({ enum: PaymentMode })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  terms?: string;
}

export class CreateCreditNoteDto {
  @ApiProperty({ example: 'uuid-invoice-id' })
  @IsUUID()
  originalInvoiceId: string;

  @ApiProperty({ example: 'Client cancelled partial services' })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiProperty({ type: [CreateLineItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems: CreateLineItemDto[];

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  date: string;
}

export class CreateDebitNoteDto {
  @ApiPropertyOptional({ example: 'uuid-invoice-id' })
  @IsOptional()
  @IsUUID()
  originalInvoiceId?: string;

  @ApiPropertyOptional({ example: 'uuid-vendor-id' })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({ example: 'Price adjustment for overcharged services' })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiProperty({ type: [CreateLineItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems: CreateLineItemDto[];

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  date: string;
}

export class InvoiceFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

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