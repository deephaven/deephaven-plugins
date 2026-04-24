import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chart, type ChartModel, ChartModelFactory } from '@deephaven/chart';
import { ActionGroup, Item, LoadingOverlay } from '@deephaven/components';
import { IrisGrid } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  usePivotMetricCalculatorFactory,
  usePivotMouseHandlers,
  usePivotRenderer,
  usePivotTheme,
} from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';
import { usePersistentState } from '@deephaven/plugin';
// TODO: Replace with import from '@deephaven/plugin' after deephaven/web-client-ui#2660 merges
import type { WidgetMiddlewarePanelProps } from './middlewareTypes';
import { usePivotToggle } from './usePivotToggle';
import type { ColumnInfo, PivotConfig } from './usePivotToggle';
import { PivotBuilderDialog } from './PivotBuilderDialog';

const log = Log.module('@deephaven/js-plugin-grid-toolbar');

interface GridToolbarState {
  view: 'grid' | 'chart' | 'pivot';
  pivotConfig: PivotConfig | null;
}

const PERSISTENT_STATE_CONFIG = {
  type: 'GridToolbar',
  version: 1,
  deleteOnUnmount: false,
};

const DEFAULT_STATE: GridToolbarState = { view: 'grid', pivotConfig: null };

export function GridToolbarPanelMiddleware({
  Component,
  fetch,
  glEventHub,
  metadata,
  ...props
}: WidgetMiddlewarePanelProps): JSX.Element {
  const dh = useApi();
  const [persistedState, setPersistedState] =
    usePersistentState<GridToolbarState>(
      DEFAULT_STATE,
      PERSISTENT_STATE_CONFIG
    );
  const [view, setView] = useState<'grid' | 'chart' | 'pivot'>(
    persistedState.view
  );
  const [chartModel, setChartModel] = useState<ChartModel | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [showPivotBuilder, setShowPivotBuilder] = useState(false);
  const [pivotColumns, setPivotColumns] = useState<ColumnInfo[] | null>(null);
  const lastPivotConfig = persistedState.pivotConfig;
  const setLastPivotConfig = useCallback(
    (config: PivotConfig | null) => {
      setPersistedState((prev: GridToolbarState) => ({
        ...prev,
        pivotConfig: config,
      }));
    },
    [setPersistedState]
  );

  const {
    isAvailable: isPivotAvailable,
    pivotModel,
    isBuilding: isPivotBuilding,
    fetchColumns,
    buildPivot,
    closePivot,
  } = usePivotToggle(
    dh,
    fetch,
    setView as (v: 'grid' | 'pivot') => void,
    metadata
  );

  const mouseHandlers = usePivotMouseHandlers();
  const renderer = usePivotRenderer();
  const pivotTheme = usePivotTheme();
  const getPivotMetricCalculator = usePivotMetricCalculatorFactory();

  // Probe the query on mount to determine if it's running
  useEffect(() => {
    let cancelled = false;
    fetch()
      .then(() => {
        if (!cancelled) setIsQueryReady(true);
      })
      .catch(() => {
        if (!cancelled) setIsQueryReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetch]);

  // Persist the current view mode whenever it changes
  useEffect(() => {
    setPersistedState((prev: GridToolbarState) =>
      prev.view !== view ? { ...prev, view } : prev
    );
  }, [view, setPersistedState]);

  // On mount, restore pivot view if persisted state has a pivot config
  const hasRestoredRef = useRef(false);

  const buildChart = useCallback(async () => {
    setIsBuilding(true);
    try {
      // fetch is typed as () => Promise<unknown>; for grid widgets it returns dh.Table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = (await fetch()) as any;
      if (table?.columns == null || table.columns.length < 2) {
        log.warn('Table has fewer than 2 columns; cannot build chart');
        return;
      }
      const settings = {
        type: 'LINE' as const,
        series: [table.columns[1].name as string],
        xAxis: table.columns[0].name as string,
      };
      const model = await ChartModelFactory.makeModelFromSettings(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dh as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        settings as any,
        table
      );
      setChartModel(model);
      setView('chart');
    } catch (e) {
      log.error('Failed to build chart model', e);
    } finally {
      setIsBuilding(false);
    }
  }, [dh, fetch]);

  useEffect(() => {
    if (hasRestoredRef.current) {
      return;
    }
    if (persistedState.view === 'pivot') {
      if (persistedState.pivotConfig == null || !isPivotAvailable) {
        return;
      }
      hasRestoredRef.current = true;
      buildPivot(persistedState.pivotConfig).catch(e => {
        log.error('Failed to restore pivot from persisted state', e);
      });
    } else if (persistedState.view === 'chart') {
      hasRestoredRef.current = true;
      buildChart().catch(e => {
        log.error('Failed to restore chart from persisted state', e);
      });
    } else {
      hasRestoredRef.current = true;
    }
    // Only run on mount / when pivot becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPivotAvailable]);

  useEffect(
    () => () => {
      chartModel?.close();
    },
    [chartModel]
  );

  const handleGrid = useCallback(() => {
    setView('grid');
  }, []);

  const handleChart = useCallback(async () => {
    if (view === 'chart') {
      return;
    }
    await buildChart();
  }, [view, buildChart]);

  const handlePivotClick = useCallback(async () => {
    // If already in pivot view, open the dialog to change settings.
    // If switching to pivot with existing config, reuse it directly.
    // If no config yet (first time), open the dialog.
    if (view !== 'pivot' && lastPivotConfig != null) {
      await buildPivot(lastPivotConfig);
      return;
    }
    try {
      const columns = await fetchColumns();
      setPivotColumns(columns);
      setShowPivotBuilder(true);
    } catch (e) {
      log.error('Failed to fetch columns for pivot builder', e);
    }
  }, [view, lastPivotConfig, fetchColumns, buildPivot]);

  const handleViewAction = useCallback(
    (key: React.Key) => {
      switch (key) {
        case 'grid':
          handleGrid();
          break;
        case 'chart':
          handleChart();
          break;
        case 'pivot':
          handlePivotClick();
          break;
        default:
          break;
      }
    },
    [handleGrid, handleChart, handlePivotClick]
  );

  const anyBuilding = isBuilding || isPivotBuilding;

  const disabledKeys = useMemo(() => {
    if (!isQueryReady) {
      return ['grid', 'chart', 'pivot'];
    }
    const keys: string[] = [];
    if (anyBuilding) {
      keys.push('chart', 'pivot');
    }
    if (!isPivotAvailable) {
      keys.push('pivot');
    }
    return keys;
  }, [isQueryReady, anyBuilding, isPivotAvailable]);

  const handlePivotApply = useCallback(
    async (config: PivotConfig) => {
      setShowPivotBuilder(false);
      setPivotColumns(null);
      setLastPivotConfig(config);
      await buildPivot(config);
    },
    [buildPivot, setLastPivotConfig]
  );

  const handlePivotCancel = useCallback(() => {
    setShowPivotBuilder(false);
    setPivotColumns(null);
  }, []);

  return (
    <div className="grid-toolbar-middleware h-100 w-100">
      <div className="grid-toolbar" style={{ padding: 10 }}>
        <ActionGroup
          selectionMode="single"
          selectedKeys={[view]}
          disabledKeys={disabledKeys}
          disallowEmptySelection
          onAction={handleViewAction}
        >
          <Item key="grid">Grid</Item>
          <Item key="chart">Chart</Item>
          <Item key="pivot">Pivot</Item>
        </ActionGroup>
      </div>
      <div
        className="grid-toolbar-content h-100 w-100"
        style={{ position: 'relative' }}
      >
        {view === 'chart' && chartModel != null && (
          <div className="h-100 w-100">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Chart model={chartModel as any} />
          </div>
        )}
        {view === 'pivot' && pivotModel != null && (
          <div className="h-100 w-100">
            <IrisGrid
              model={pivotModel}
              mouseHandlers={mouseHandlers}
              renderer={renderer}
              theme={pivotTheme}
              // getMetricCalculator exists on IrisGrid at runtime but is not
              // in the type declarations for the current @deephaven/iris-grid version
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, react/jsx-props-no-spreading
              {...({ getMetricCalculator: getPivotMetricCalculator } as any)}
            />
          </div>
        )}
        {view !== 'chart' && view !== 'pivot' && (
          <Component
            fetch={fetch}
            glEventHub={glEventHub}
            metadata={metadata}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
          />
        )}
        <LoadingOverlay isLoading={anyBuilding} isLoaded />
      </div>
      {showPivotBuilder && pivotColumns != null && (
        <PivotBuilderDialog
          columns={pivotColumns}
          initialConfig={lastPivotConfig}
          onApply={handlePivotApply}
          onCancel={handlePivotCancel}
        />
      )}
    </div>
  );
}

export default GridToolbarPanelMiddleware;
