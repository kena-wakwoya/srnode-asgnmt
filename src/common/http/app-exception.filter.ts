import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';
import { ErrorResponseDto } from './error-response.dto';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const requestId = request.requestId ?? 'unknown';

    const { status, body } = this.toResponse(exception, requestId);

    if (status >= 500) {
      this.logger.error(
        { requestId, code: body.error.code },
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private toResponse(
    exception: unknown,
    requestId: string,
  ): { status: number; body: ErrorResponseDto } {
    if (exception instanceof AppError) {
      return {
        status: exception.httpStatus,
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            requestId,
          },
        },
      };
    }

    if (exception instanceof NotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: {
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'The requested resource was not found',
            requestId,
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        body: {
          error: {
            code:
              status >= 500
                ? ErrorCodes.INTERNAL_ERROR
                : ErrorCodes.BAD_REQUEST,
            message: this.safeHttpMessage(exception, status),
            requestId,
          },
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
          requestId,
        },
      },
    };
  }

  private safeHttpMessage(exception: HttpException, status: number): string {
    if (status >= 500) {
      return 'An unexpected error occurred';
    }

    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return payload;
    }

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload
    ) {
      const message = (payload as { message: string | string[] }).message;
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message)) {
        return message.join('; ');
      }
    }

    return exception.message;
  }
}
