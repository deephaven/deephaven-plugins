import React from 'react';
import { TestUtils } from '@deephaven/test-utils';
import { render, screen } from '@testing-library/react';
import { ReactPanelErrorBoundary } from './ReactPanelErrorBoundary';

// Mock the WidgetErrorView component
jest.mock('../widget/WidgetErrorView', () => ({
  __esModule: true,
  default: function MockWidgetErrorView({ error }: { error: Error }) {
    return <div data-testid="mock-error-view">{error.message}</div>;
  },
}));

describe('ReactPanelErrorBoundary', () => {
  // Suppress console.error for our intentional errors
  beforeAll(() => {
    TestUtils.disableConsoleOutput();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ReactPanelErrorBoundary>
        <div data-testid="test-child">Test Content</div>
      </ReactPanelErrorBoundary>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-error-view')).not.toBeInTheDocument();
  });

  it('renders error view when child throws error', () => {
    const ErrorComponent = () => {
      throw new Error('Test error message');
    };

    render(
      <ReactPanelErrorBoundary>
        <ErrorComponent />
      </ReactPanelErrorBoundary>
    );

    expect(screen.getByTestId('mock-error-view')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('recovers when children are updated after error', () => {
    const ErrorComponent = () => {
      throw new Error('Test error message');
    };

    const { rerender } = render(
      <ReactPanelErrorBoundary>
        <ErrorComponent />
      </ReactPanelErrorBoundary>
    );

    // Verify error state
    expect(screen.getByTestId('mock-error-view')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();

    // Update with working component
    rerender(
      <ReactPanelErrorBoundary>
        <div data-testid="working-component">Working Content</div>
      </ReactPanelErrorBoundary>
    );

    // Verify recovery
    expect(screen.getByTestId('working-component')).toBeInTheDocument();
    expect(screen.getByText('Working Content')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-error-view')).not.toBeInTheDocument();
  });

  it('maintains error state when props update does not include children change', () => {
    const ErrorComponent = () => {
      throw new Error('Test error message');
    };

    const { rerender } = render(
      <ReactPanelErrorBoundary>
        <ErrorComponent />
      </ReactPanelErrorBoundary>
    );

    // Verify initial error state
    expect(screen.getByTestId('mock-error-view')).toBeInTheDocument();

    // Rerender with same children
    rerender(
      <ReactPanelErrorBoundary>
        <ErrorComponent />
      </ReactPanelErrorBoundary>
    );

    // Error view should still be present
    expect(screen.getByTestId('mock-error-view')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('calls componentDidCatch when error occurs', () => {
    const errorSpy = jest.spyOn(
      ReactPanelErrorBoundary.prototype,
      'componentDidCatch'
    );
    const ErrorComponent = () => {
      throw new Error('Test error message');
    };

    render(
      <ReactPanelErrorBoundary>
        <ErrorComponent />
      </ReactPanelErrorBoundary>
    );

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(errorSpy.mock.calls[0][0].message).toBe('Test error message');

    errorSpy.mockRestore();
  });

  it('does not throw an error when children are undefined', () => {
    expect(() =>
      render(<ReactPanelErrorBoundary>{undefined}</ReactPanelErrorBoundary>)
    ).not.toThrow();
  });
});
