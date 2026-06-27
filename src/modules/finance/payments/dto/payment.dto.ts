import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaymentMode } from '../../../../common/enums';

export class RecordPaymentDto {
  @ApiProperty({ example: 'uuid-invoice-id' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ example: 118000, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMode, example: PaymentMode.BANK_TRANSFER })
  @IsEnum(PaymentMode, { message: 'Invalid payment mode' })
  paymentMode: PaymentMode;

  @ApiPropertyOptional({ example: 'UTR2026060112345' })
  @ValidateIf((o: RecordPaymentDto) => o.paymentMode === PaymentMode.UPI || o.paymentMode === PaymentMode.BANK_TRANSFER)
  @IsString()
  @MaxLength(50)
  utrNumber?: string;

  @ApiPropertyOptional({ example: '123456' })
  @ValidateIf((o: RecordPaymentDto) => o.paymentMode === PaymentMode.CHEQUE)
  @IsString()
  @MaxLength(20)
  chequeNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ example: 'Payment received via NEFT' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

export class PaymentFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMode?: string;

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