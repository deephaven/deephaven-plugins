import { IrisGridSidebarContext } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import type { WidgetMiddlewarePanelProps } from '@deephaven/plugin';
import { useComposedSidebarExtension } from './useComposedSidebarExtension';

const log = Log.module(
  '@deephaven/js-plugin-table-options-example/TableOptionsExamplePanelMiddleware'
);

/**
 * Middleware that wraps the panel widget (`IrisGridPanel` host) in an
 * `IrisGridSidebarContext.Provider`. Same composition rules as the
 * non-panel `TableOptionsExampleMiddleware`.
 */
export function TableOptionsExamplePanelMiddleware({
  Component,
  ...props
}: WidgetMiddlewarePanelProps): JSX.Element {
  const extension = useComposedSidebarExtension();
  log.debug('Wrapping panel component', { Component, props });
  return (
    <IrisGridSidebarContext.Provider value={extension}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </IrisGridSidebarContext.Provider>
  );
}

export default TableOptionsExamplePanelMiddleware;
