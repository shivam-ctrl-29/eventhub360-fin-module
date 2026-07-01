import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { RegisterDto, LoginDto } from '../dto/auth.dto'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { ok } from '../../../shared/response.helper'

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.svc.register(dto)
    return ok(result, 'Account created successfully')
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.svc.login(dto)
    return ok(result, 'Login successful')
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const user = await this.svc.me(String(req.user.sub))
    return ok(user)
  }
}
