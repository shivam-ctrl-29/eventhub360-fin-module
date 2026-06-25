import { Body, Controller, Post, SetMetadata } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';

/**
 * DEVELOPMENT-ONLY auth helper.
 *
 * In production, JWTs are issued by the central Auth Service and this module
 * only validates them. This endpoint exists so the app can be run locally
 * without that service: it mints a signed token for a chosen role.
 *
 * Remove or disable this controller before deploying to production.
 */
@ApiTags('Auth (dev)')
@Controller('fin/auth')
export class DevAuthController {
  constructor(private readonly jwt: JwtService) {}

  @Post('dev-login')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @ApiOperation({ summary: 'DEV ONLY: mint a JWT for a chosen finance role' })
  devLogin(@Body() body: { email?: string; name?: string; role?: string }) {
    const role = body?.role || 'finance_manager';
    const allRoles = [
      'finance_manager',
      'cfo',
      'accounts_head',
      'accountant',
      'auditor',
    ];

    const payload = {
      sub: '00000000-0000-0000-0000-000000000001',
      email: body?.email || 'dev@eventhub360.com',
      name: body?.name || 'Dev User',
      role,
      // grant the chosen role plus every finance role so the API guard
      // never blocks while testing locally
      roles: Array.from(new Set([role, ...allRoles])),
    };

    const token = this.jwt.sign(payload);

    return {
      token,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    };
  }
}
