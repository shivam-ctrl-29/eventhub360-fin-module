import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { ROLES_KEY } from '../common/decorators';
  import { FinanceRole } from '../common/enums';
  import { JwtPayload } from '../common/interfaces';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<FinanceRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
  
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest();
      const user = request.user as JwtPayload;
  
      if (!user || !user.roles || user.roles.length === 0) {
        throw new ForbiddenException(
          'Access denied. You do not have the required permissions.',
        );
      }
  
      const hasRole = requiredRoles.some((role) =>
        user.roles.includes(role),
      );
  
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`,
        );
      }
  
      return true;
    }
  }