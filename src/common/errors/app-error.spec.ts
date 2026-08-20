import { AppError } from './app-error';

describe('AppError', () => {
  it('carries a stable code, HTTP status, and retryable flag', () => {
    const error = new AppError(
      'IMPORT_FILE_TOO_LARGE',
      'too large',
      413,
      false,
    );

    expect(error.code).toBe('IMPORT_FILE_TOO_LARGE');
    expect(error.httpStatus).toBe(413);
    expect(error.retryable).toBe(false);
    expect(error.message).toBe('too large');
  });

  it('does not treat unexpected failures as retryable', () => {
    const error = AppError.internal('boom', new Error('db down'));

    expect(error.retryable).toBe(false);
    expect(error.httpStatus).toBe(500);
    expect(error.cause).toBeInstanceOf(Error);
  });
});
