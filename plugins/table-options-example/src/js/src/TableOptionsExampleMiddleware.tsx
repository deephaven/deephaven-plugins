import { IrisGridTableOptionsContext } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import type { WidgetMiddlewareComponentProps } from '@deephaven/plugin';
import { useComposedTableOptionsExtension } from './useComposedTableOptionsExtension';

const log = Log.module(
  '@deephaven/js-plugin-table-options-example/TableOptionsExampleMiddleware'
);

/**
 * Middleware that wraps the base widget component (the non-panel
 * `WidgetComponentProps` path, e.g. dashboard widgets via
 * `GridWidgetPlugin`) in an `IrisGridTableOptionsContext.Provider`.
 */
export function TableOptionsExampleMiddleware({
  Component,
  ...props
}: WidgetMiddlewareComponentProps): JSX.Element {
  const extension = useComposedTableOptionsExtension();
  log.debug('Wrapping widget component', { Component, props });
  return (
    <IrisGridTableOptionsContext.Provider value={extension}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </IrisGridTableOptionsContext.Provider>
  );
}

export default TableOptionsExampleMiddleware;
