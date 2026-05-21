import { IrisGridTableOptionsContext } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import type { WidgetMiddlewarePanelProps } from '@deephaven/plugin';
import { useComposedTableOptionsExtension } from './useComposedTableOptionsExtension';

const log = Log.module(
  '@deephaven/js-plugin-table-options-example/TableOptionsExamplePanelMiddleware'
);

/**
 * Middleware that wraps the panel widget (`IrisGridPanel` host) in an
 * `IrisGridTableOptionsContext.Provider`. Same composition rules as the
 * non-panel `TableOptionsExampleMiddleware`.
 */
export function TableOptionsExamplePanelMiddleware({
  Component,
  ...props
}: WidgetMiddlewarePanelProps): JSX.Element {
  const extension = useComposedTableOptionsExtension();
  log.debug('Wrapping panel component', { Component, props });
  return (
    <IrisGridTableOptionsContext.Provider value={extension}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </IrisGridTableOptionsContext.Provider>
  );
}

export default TableOptionsExamplePanelMiddleware;
