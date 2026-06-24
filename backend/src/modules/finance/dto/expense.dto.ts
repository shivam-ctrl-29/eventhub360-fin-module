import { IsString, IsNumber, IsDateString, IsOptional, IsIn, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationDto } from './pagination.dto'

export class CreateExpenseDto {
  @IsIn(['food_beverage', 'logistics', 'travel', 'marketing', 'venue', 'decor', 'miscellaneous'])
  category: string

  @IsString() description: string
  @IsNumber() @Min(0.01) @Type(() => Number) amount: number
  @IsDateString() submittedDate: string
  @IsOptional() @IsString() receiptUrl?: string
  @IsOptional() @IsString() remarks?: string
}

export class ExpenseListDto extends PaginationDto {
  @IsOptional() @IsString() status?: string
  @IsOptional() @IsString() category?: string
}

export class RejectExpenseDto {
  @IsString() reason: string
}
