import { useCallback, useEffect, useState } from 'react';
import { Chart, type ChartModel, ChartModelFactory } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
// TODO: Replace with import from '@deephaven/plugin' after deephaven/web-client-ui#2660 merges
import type { WidgetMiddlewarePanelProps } from './middlewareTypes';

const log = Log.module('@deephaven/js-plugin-grid-toolbar');

// Matches InputFilterEvent.CLEAR_ALL_FILTERS from @deephaven/dashboard-core-plugins
const CLEAR_ALL_FILTERS_EVENT = 'InputFilterEvent.CLEAR_ALL_FILTERS';

export function GridToolbarPanelMiddleware({
  Component,
  fetch,
  glEventHub,
  ...props
}: WidgetMiddlewarePanelProps): JSX.Element {
  const dh = useApi();
  const [view, setView] = useState<'grid' | 'chart'>('grid');
  const [chartModel, setChartModel] = useState<ChartModel | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

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
      if (!table?.columns || table.columns.length < 2) {
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

  return (
    <div className="grid-toolbar-middleware h-100 w-100">
      <div className="grid-toolbar">
        <button
          type="button"
          className="grid-toolbar-btn"
          disabled={isBuilding}
          onClick={handleChart}
        >
          {view === 'chart' ? 'Grid' : 'Chart'}
        </button>
        <button
          type="button"
          className="grid-toolbar-btn"
          onClick={handleResetFilters}
        >
          Reset Filters
        </button>
      </div>
      <div className="grid-toolbar-content h-100 w-100">
        {view === 'chart' && chartModel != null ? (
          <div className="h-100 w-100">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Chart model={chartModel as any} />
          </div>
        ) : (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <Component fetch={fetch} glEventHub={glEventHub} {...props} />
        )}
      </div>
    </div>
  );
}

export default GridToolbarPanelMiddleware;
