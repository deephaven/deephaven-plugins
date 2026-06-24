import React from 'react';
import { TestUtils } from '@deephaven/test-utils';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  // Suppress console.error for our intentional errors
  beforeAll(() => {
    TestUtils.disableConsoleOutput();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="test-child">Test Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders the fallback when a child throws an error', () => {
    const ErrorComponent = (): JSX.Element => {
      throw new Error('Test error message');
    };

    render(
      <ErrorBoundary fallback={<div>Fallback content</div>}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Fallback content')).toBeInTheDocument();
  });

  it('calls onError with a serializable error when a child throws', () => {
    const onError = jest.fn();
    const ErrorComponent = (): JSX.Element => {
      throw new Error('Test error message');
    };

    render(
      <ErrorBoundary fallback={<div>Fallback content</div>} onError={onError}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error message',
        name: 'Error',
        stack: expect.any(String),
        componentStack: expect.any(String),
      })
    );
  });
});
