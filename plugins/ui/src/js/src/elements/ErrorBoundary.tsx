import React, { useCallback } from 'react';
import {
  ErrorBoundary as DHCErrorBoundary,
  type ErrorBoundaryProps as DHCErrorBoundaryProps,
} from '@deephaven/components';

/**
 * A JSON serializable representation of an error caught by the ErrorBoundary.
 * The native `Error`/`ErrorInfo` objects can't be sent back to the server, so
 * we pull out the relevant fields into a plain object.
 */
export interface SerializedError {
  /** The error message */
  message: string;

  /** The name/type of the error */
  name: string;

  /** The stack trace of the error, if available */
  stack?: string;

  /** The React component stack where the error occurred, if available */
  componentStack?: string;
}

export interface ErrorBoundaryProps
  extends Omit<DHCErrorBoundaryProps, 'onError'> {
  /** Callback for when an error is caught by the boundary */
  onError?: (error: SerializedError) => void;
}

export function ErrorBoundary({
  onError: propOnError,
  ...otherProps
}: ErrorBoundaryProps): JSX.Element {
  const onError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      propOnError?.({
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack ?? undefined,
      });
    },
    [propOnError]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCErrorBoundary {...otherProps} onError={onError} />
  );
}

ErrorBoundary.displayName = 'ErrorBoundary';

export default ErrorBoundary;
