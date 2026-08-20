export class AppError extends Error {
  readonly name = 'AppError';

  constructor(
    readonly code: string,
    message: string,
    readonly httpStatus: number,
    readonly retryable: boolean = false,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }

  static notFound(message = 'The requested resource was not found'): AppError {
    return new AppError('NOT_FOUND', message, 404, false);
  }

  static internal(
    message = 'An unexpected error occurred',
    cause?: unknown,
  ): AppError {
    return new AppError('INTERNAL_ERROR', message, 500, false, { cause });
  }
}
