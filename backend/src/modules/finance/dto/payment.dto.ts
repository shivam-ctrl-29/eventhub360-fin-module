import { IsString, IsNumber, IsDateString, IsOptional, IsIn, Min, IsUUID } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationDto } from './pagination.dto'

export class RecordPaymentDto {
  @IsUUID() invoiceId: string
  @IsNumber() @Min(0.01) @Type(() => Number) amount: number
  @IsIn(['upi', 'bank_transfer', 'cheque', 'cash', 'card']) paymentMode: string
  @IsDateString() paymentDate: string
  @IsOptional() @IsString() utrNumber?: string
  @IsOptional() @IsString() chequeNumber?: string
  @IsOptional() @IsString() bankName?: string
  @IsOptional() @IsString() remarks?: string
}

export class PaymentListDto extends PaginationDto {
  @IsOptional() @IsString() status?: string
}
