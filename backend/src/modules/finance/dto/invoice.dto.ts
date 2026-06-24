import {
  IsString, IsDateString, IsOptional, IsArray, IsNumber,
  ValidateNested, IsIn, Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationDto } from './pagination.dto'

export class LineItemDto {
  @IsString() description: string
  @IsNumber() @Min(0.01) quantity: number
  @IsNumber() @Min(0) unitPrice: number
  @IsNumber() @IsIn([0, 5, 12, 18, 28]) gstRate: number
}

export class CreateInvoiceDto {
  @IsOptional() @IsString() customerId?: string
  @IsDateString() issueDate: string
  @IsDateString() dueDate: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto) lineItems: LineItemDto[]
  @IsOptional() @IsString() notes?: string
  @IsOptional() @IsString() customerName?: string
  @IsOptional() @IsString() customerEmail?: string
  @IsOptional() @IsString() customerGstin?: string
}

export class InvoiceListDto extends PaginationDto {
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() customerId?: string
  @IsOptional() @IsDateString() dateFrom?: string
  @IsOptional() @IsDateString() dateTo?: string
}

export class CreateCreditNoteDto {
  @IsString() originalInvoiceId: string
  @IsString() reason: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto) lineItems: LineItemDto[]
}
