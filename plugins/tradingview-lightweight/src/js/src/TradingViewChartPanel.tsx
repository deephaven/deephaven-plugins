import React, { useCallback, useState } from 'react';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { type WidgetPanelProps } from '@deephaven/plugin';
import { WidgetPanel } from '@deephaven/dashboard-core-plugins';
import TradingViewChart from './TradingViewChart';

/**
 * Panel wrapper for TradingViewChart.
 *
 * Wraps the chart in WidgetPanel to get standard DH panel features:
 * - Session-level disconnect/reconnect detection
 * - LoadingOverlay (spinner + error + disconnect message)
 * - Panel lifecycle (hide/show/focus events)
 */
export function TradingViewChartPanel(
  props: WidgetPanelProps<DhType.Widget>
): JSX.Element {
  const { fetch, metadata } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDisconnected, setIsDisconnected] = useState(false);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const handleError = useCallback((err: string | null) => {
    setError(err);
  }, []);

  const handleSessionClose = useCallback(() => {
    setIsDisconnected(true);
    setError('Chart disconnected');
  }, []);

  const handleSessionOpen = useCallback(() => {
    setIsDisconnected(false);
    setError(null);
  }, []);

  const name = metadata?.name ?? 'TradingView Chart';

  // Cast to any to bridge golden-layout type version mismatches between
  // @deephaven/plugin and @deephaven/dashboard-core-plugins.
  // At runtime these are the same objects provided by the IDE.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wp = WidgetPanel as any;

  return React.createElement(
    wp,
    {
      glContainer: props.glContainer,
      glEventHub: props.glEventHub,
      descriptor: {
        name,
        type: 'TvlChart',
      },
      className: 'dh-tvl-panel',
      isLoading,
      isLoaded: !isLoading,
      isDisconnected,
      errorMessage: error ?? '',
      onSessionClose: handleSessionClose,
      onSessionOpen: handleSessionOpen,
    },
    <TradingViewChart
      fetch={fetch}
      metadata={metadata}
      onLoadingChange={handleLoadingChange}
      onError={handleError}
    />
  );
}

export default TradingViewChartPanel;
