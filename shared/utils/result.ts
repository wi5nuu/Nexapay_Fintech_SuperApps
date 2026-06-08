/**
 * Result Pattern for Functional Error Handling
 * 
 * This utility provides a standardized way to handle success and failure cases
 * without relying on exceptions for expected business logic errors.
 */

export type Result<T, E = Error> = Success<T, E> | Failure<T, E>;

export class Success<T, E> {
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  isSuccess(): this is Success<T, E> {
    return true;
  }

  isFailure(): this is Failure<T, E> {
    return false;
  }

  getValueOrThrow(): T {
    return this.value;
  }
}

export class Failure<T, E> {
  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  isSuccess(): this is Success<T, E> {
    return false;
  }

  isFailure(): this is Failure<T, E> {
    return true;
  }

  getError(): E {
    return this.error;
  }
}

/**
 * Helper function to create a success result
 */
export const success = <T, E>(value: T): Result<T, E> => new Success(value);

/**
 * Helper function to create a failure result
 */
export const failure = <T, E>(error: E): Result<T, E> => new Failure(error);
