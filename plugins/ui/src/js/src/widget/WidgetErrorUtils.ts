import { WidgetAction, isWidgetError } from './WidgetTypes';

/**
 * Get the name of an error type
 * @param error Name of an error
 * @returns The name of the error
 */
export function getErrorName(error: NonNullable<unknown>): string {
  if (isWidgetError(error)) {
    return error.name;
  }
  const errorType =
    typeof error === 'object' ? error.constructor.name ?? '' : typeof error;
  if (errorType.endsWith('Error')) {
    return errorType;
  }
  return 'Unknown error';
}

/**
 * Get the message of an error
 * @param error Error object
 * @returns The error message
 */
export function getErrorMessage(error: NonNullable<unknown>): string {
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message.trim();
  }
  if (typeof error === 'string') {
    return error.trim();
  }
  return 'Unknown error';
}

/**
 * Get the short message of an error. Just the first line of the error message.
 * @param error Error object
 * @returns The error short message
 */
export function getErrorShortMessage(error: NonNullable<unknown>): string {
  const message = getErrorMessage(error);
  const lines = message.split('\n');
  return lines[0].trim();
}

/**
 * Get the stack trace of an error
 * @param error Error object
 * @returns The error stack trace
 */
export function getErrorStack(error: NonNullable<unknown>): string {
  if (isWidgetError(error)) {
    return error.stack ?? '';
  }
  return '';
}

/**
 * Get the action from an error object if it exists
 * @param error Error object
 * @returns The action from the error, if it exists
 */
export function getErrorAction(
  error: NonNullable<unknown>
): WidgetAction | null {
  if (isWidgetError(error)) {
    return error.action ?? null;
  }
  return null;
}
