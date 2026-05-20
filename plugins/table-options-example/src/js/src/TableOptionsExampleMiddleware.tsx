import { IrisGridSidebarContext } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import type { WidgetMiddlewareComponentProps } from '@deephaven/plugin';
import { useComposedSidebarExtension } from './useComposedSidebarExtension';

const log = Log.module(
  '@deephaven/js-plugin-table-options-example/TableOptionsExampleMiddleware'
);

/**
 * Middleware that wraps the base widget component (the non-panel
 * `WidgetComponentProps` path, e.g. dashboard widgets via
 * `GridWidgetPlugin`) in an `IrisGridSidebarContext.Provider`.
 */
export function TableOptionsExampleMiddleware({
  Component,
  ...props
}: WidgetMiddlewareComponentProps): JSX.Element {
  const extension = useComposedSidebarExtension();
  log.info('Wrapping widget component', { Component, props });
  return (
    <IrisGridSidebarContext.Provider value={extension}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </IrisGridSidebarContext.Provider>
  );
}

export default TableOptionsExampleMiddleware;
