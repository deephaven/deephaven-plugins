import Log from '@deephaven/log';
import React, { Component, ReactNode } from 'react';
import WidgetErrorView from '../widget/WidgetErrorView';

const log = Log.module('ReactPanelErrorBoundary');

export interface ReactPanelErrorBoundaryProps {
  /** Children to catch errors from. Error will reset when the children have been updated. */
  children: ReactNode;
}

export interface ReactPanelErrorBoundaryState {
  /** Currently displayed error. Reset when children are updated. */
  error?: Error;
}

/**
 * Error boundary for catching render errors in React. Displays an error message until the children have updated.
 */
export class ReactPanelErrorBoundary extends Component<
  ReactPanelErrorBoundaryProps,
  ReactPanelErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error): ReactPanelErrorBoundaryState {
    return { error };
  }

  constructor(props: ReactPanelErrorBoundaryProps) {
    super(props);
    this.state = { error: undefined };
  }

  componentDidUpdate(
    prevProps: Readonly<ReactPanelErrorBoundaryProps>,
    prevState: Readonly<ReactPanelErrorBoundaryState>
  ): void {
    const { children } = this.props;
    if (prevProps.children !== children && prevState.error != null) {
      log.debug(
        'ReactPanelErrorBoundary clearing previous error',
        prevState.error,
        children
      );
      this.setState({ error: undefined });
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    log.error('Error caught by ErrorBoundary', error, errorInfo);
  }

  render(): ReactNode {
    const { children } = this.props;
    const { error } = this.state;
    // We need to check for undefined children because React will throw an error if we return undefined from a render method
    // Note this behaviour was changed in React 18: https://github.com/reactwg/react-18/discussions/75
    return error != null ? <WidgetErrorView error={error} /> : children ?? null;
  }
}

export default ReactPanelErrorBoundary;
