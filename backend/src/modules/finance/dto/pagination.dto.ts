import { IsOptional, IsInt, IsString, IsIn, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit = 20
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsString() sortBy?: string
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder: 'asc' | 'desc' = 'desc'
}
