import { useCallback } from 'react';
import Log from '@deephaven/log';
// TODO: Replace with import from '@deephaven/plugin' after deephaven/web-client-ui#2660 merges
import type { WidgetMiddlewareComponentProps } from './middlewareTypes';

const log = Log.module('@deephaven/js-plugin-grid-toolbar');

export function GridToolbarMiddleware({
  Component,
  ...props
}: WidgetMiddlewareComponentProps): JSX.Element {
  const handleExport = useCallback(() => {
    log.info('Export clicked');
  }, []);

  const handleResetFilters = useCallback(() => {
    log.info('[0] Reset Filters clicked', props, Component);
  }, [props, Component]);

  return (
    <div className="grid-toolbar-middleware">
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
      <div className="grid-toolbar-content">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...props} />
      </div>
    </div>
  );
}

export default GridToolbarMiddleware;
