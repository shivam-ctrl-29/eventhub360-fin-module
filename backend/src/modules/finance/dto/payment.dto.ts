import { IsString, IsNumber, IsDateString, IsOptional, IsIn, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationDto } from './pagination.dto'

export class RecordPaymentDto {
  @IsString() invoiceId: string
  @IsNumber() @Min(0.01) @Type(() => Number) amount: number
  @IsIn(['UPI', 'Card', 'Bank', 'Cash', 'Cheque']) paymentMode: string
  @IsDateString() paymentDate: string
  @IsOptional() @IsString() utrNumber?: string
  @IsOptional() @IsString() remarks?: string
}

export class PaymentListDto extends PaginationDto {
  @IsOptional() @IsString() invoiceId?: string
}
