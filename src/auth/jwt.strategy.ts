import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../common/interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'jwt.secret',
        'change-me-in-production',
      ),
    });
  }

  /**
   * Passport places the returned object on `request.user`.
   * The token is issued by the central Auth Service shared across all modules.
   * We normalise both `role` (string) and `roles` (string[]) payload shapes.
   */
  validate(payload: Record<string, unknown>): JwtPayload {
    const rawRoles =
      (payload.roles as string[] | undefined) ??
      (payload.role ? [payload.role as string] : []);

    return {
      sub: (payload.sub as string) ?? (payload.userId as string),
      email: payload.email as string,
      roles: rawRoles,
      companyId: payload.companyId as string | undefined,
      branchId:
        (payload.branchId as string | undefined) ??
        (Array.isArray(payload.branchIds)
          ? (payload.branchIds[0] as string)
          : undefined),
      iat: payload.iat as number | undefined,
      exp: payload.exp as number | undefined,
    };
  }
}
