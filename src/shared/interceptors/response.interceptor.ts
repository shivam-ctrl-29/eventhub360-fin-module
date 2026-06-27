import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  import { ApiResponse } from '../../common/interfaces';
  
  @Injectable()
  export class ResponseInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>>
  {
    intercept(
      _context: ExecutionContext,
      next: CallHandler,
    ): Observable<ApiResponse<T>> {
      return next.handle().pipe(
        map((data) => {
          if (
            data &&
            typeof data === 'object' &&
            'success' in data &&
            'data' in data
          ) {
            return data as ApiResponse<T>;
          }
          return {
            success: true,
            data,
          };
        }),
      );
    }
  }