import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { Prisma } from '@prisma/client';
  import { ApiResponse } from '../../common/interfaces';
  
  @Catch()
  export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);
  
    catch(exception: unknown, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let errors: { field: string; message: string }[] | undefined;
  
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
  
        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (
          typeof exceptionResponse === 'object' &&
          exceptionResponse !== null
        ) {
          const resp = exceptionResponse as Record<string, unknown>;
          message = (resp.message as string) || message;
  
          if (Array.isArray(resp.message)) {
            errors = (resp.message as string[]).map((msg) => ({
              field: this.extractField(msg),
              message: msg,
            }));
            message = 'Validation failed';
          }
        }
      } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
        if (exception.code === 'P2002') {
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[]) || [];
          message = `Duplicate entry: ${target.join(', ')} already exists`;
        } else if (exception.code === 'P2025') {
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
        } else if (exception.code === 'P2003') {
          status = HttpStatus.BAD_REQUEST;
          message = 'Referenced record does not exist';
        } else {
          this.logger.error(`Prisma error ${exception.code}:`, exception.message);
          message = 'Database error occurred';
        }
      } else if (exception instanceof Error) {
        this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
        message = exception.message;
      }
  
      const body: ApiResponse = {
        success: false,
        message,
        ...(errors && { errors }),
      };
  
      this.logger.warn(
        `[${request.method}] ${request.url} → ${status}: ${message}`,
      );
  
      response.status(status).json(body);
    }
  
    private extractField(message: string): string {
      const parts = message.split(' ');
      return parts[0] || 'unknown';
    }
  }