import { useCallback } from 'react';
import Log from '@deephaven/log';
// TODO: Replace with import from '@deephaven/plugin' after deephaven/web-client-ui#2660 merges
import type { WidgetMiddlewarePanelProps } from './middlewareTypes';

const log = Log.module('@deephaven/js-plugin-grid-toolbar');

// Matches InputFilterEvent.CLEAR_ALL_FILTERS from @deephaven/dashboard-core-plugins
const CLEAR_ALL_FILTERS_EVENT = 'InputFilterEvent.CLEAR_ALL_FILTERS';

export function GridToolbarPanelMiddleware({
  Component,
  glEventHub,
  ...props
}: WidgetMiddlewarePanelProps): JSX.Element {
  const handleExport = useCallback(() => {
    log.info('Export clicked');
  }, []);

  const handleResetFilters = useCallback(() => {
    log.info('[0] Reset Filters clicked', props, Component);
    glEventHub.emit(CLEAR_ALL_FILTERS_EVENT);
  }, [glEventHub, props, Component]);

  return (
    <div className="grid-toolbar-middleware h-100 w-100">
      <div className="grid-toolbar">
        <button
          type="button"
          className="grid-toolbar-btn"
          onClick={handleExport}
        >
          Export
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
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component glEventHub={glEventHub} {...props} />
      </div>
    </div>
  );
}

export default GridToolbarPanelMiddleware;
