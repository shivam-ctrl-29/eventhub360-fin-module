import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

export class RegisterDto {
  @IsString() @MinLength(1) fullName: string
  @IsEmail() email: string
  @IsString() @MinLength(8, { message: 'Password must be at least 8 characters' }) password: string
  @IsOptional() @IsString() phone?: string
}

export class LoginDto {
  @IsEmail() email: string
  @IsString() @MinLength(1) password: string
}
