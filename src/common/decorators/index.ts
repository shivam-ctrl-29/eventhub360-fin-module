import {
    createParamDecorator,
    ExecutionContext,
    SetMetadata,
  } from '@nestjs/common';
  import { JwtPayload, PaginationQuery } from '../interfaces';
  import { FinanceRole } from '../enums';
  
  export const ROLES_KEY = 'roles';
  
  export const Roles = (...roles: FinanceRole[]): ReturnType<typeof SetMetadata> =>
    SetMetadata(ROLES_KEY, roles);
  
  export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): JwtPayload => {
      const request = ctx.switchToHttp().getRequest();
      return request.user as JwtPayload;
    },
  );
  
  export const Pagination = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): PaginationQuery => {
      const request = ctx.switchToHttp().getRequest();
      const query = request.query;
      return {
        page: Math.max(1, parseInt(query.page || '1', 10)),
        limit: Math.min(100, Math.max(1, parseInt(query.limit || '20', 10))),
        search: query.search as string | undefined,
        sortBy: query.sortBy as string | undefined,
        sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
      };
    },
  );
  
  export const IpAddress = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string => {
      const request = ctx.switchToHttp().getRequest();
      return (
        (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        request.ip ||
        'unknown'
      );
    },
  );