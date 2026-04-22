import { useCallback, useEffect, useState } from 'react';
import { Chart, type ChartModel, ChartModelFactory } from '@deephaven/chart';
import { IrisGrid } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  usePivotMouseHandlers,
  usePivotRenderer,
  usePivotTheme,
} from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';
// TODO: Replace with import from '@deephaven/plugin' after deephaven/web-client-ui#2660 merges
import type { WidgetMiddlewarePanelProps } from './middlewareTypes';
import { usePivotToggle } from './usePivotToggle';

const log = Log.module('@deephaven/js-plugin-grid-toolbar');

// Matches InputFilterEvent.CLEAR_ALL_FILTERS from @deephaven/dashboard-core-plugins
const CLEAR_ALL_FILTERS_EVENT = 'InputFilterEvent.CLEAR_ALL_FILTERS';

export function GridToolbarPanelMiddleware({
  Component,
  fetch,
  glEventHub,
  metadata,
  ...props
}: WidgetMiddlewarePanelProps): JSX.Element {
  const dh = useApi();
  const [view, setView] = useState<'grid' | 'chart' | 'pivot'>('grid');
  const [chartModel, setChartModel] = useState<ChartModel | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  const {
    isAvailable: isPivotAvailable,
    pivotModel,
    isBuilding: isPivotBuilding,
    handleToggle: handlePivot,
  } = usePivotToggle(
    dh,
    fetch,
    view === 'pivot',
    setView as (v: 'grid' | 'pivot') => void,
    metadata
  );

  const mouseHandlers = usePivotMouseHandlers();
  const renderer = usePivotRenderer();
  const pivotTheme = usePivotTheme();

  useEffect(
    () => () => {
      chartModel?.close();
    },
    [chartModel]
  );

  const handleChart = useCallback(async () => {
    if (view === 'chart') {
      setView('grid');
      return;
    }
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
  }, [dh, fetch, view]);

  const handleResetFilters = useCallback(() => {
    log.info('Reset Filters clicked');
    glEventHub.emit(CLEAR_ALL_FILTERS_EVENT);
  }, [glEventHub]);

  const anyBuilding = isBuilding || isPivotBuilding;

  return (
    <div className="grid-toolbar-middleware h-100 w-100">
      <div className="grid-toolbar">
        <button
          type="button"
          className="grid-toolbar-btn"
          disabled={anyBuilding}
          onClick={handleChart}
        >
          {view === 'chart' ? 'Grid' : 'Chart'}
        </button>
        {isPivotAvailable && (
          <button
            type="button"
            className="grid-toolbar-btn"
            disabled={anyBuilding}
            onClick={handlePivot}
          >
            {view === 'pivot' ? 'Grid' : 'Pivot'}
          </button>
        )}
        <button
          type="button"
          className="grid-toolbar-btn"
          onClick={handleResetFilters}
        >
          Reset Filters
        </button>
      </div>
      <div className="grid-toolbar-content h-100 w-100">
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
            />
          </div>
        )}
        {view !== 'chart' && view !== 'pivot' && (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <Component
            fetch={fetch}
            glEventHub={glEventHub}
            metadata={metadata}
            {...props}
          />
        )}
      </div>
    </div>
  );
}

export default GridToolbarPanelMiddleware;
