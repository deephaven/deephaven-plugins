import { useMemo } from 'react';
import { IrisGridTableOptionsContext } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import type { WidgetMiddlewarePanelProps } from '@deephaven/plugin';
import { useComposedTableOptionsExtension } from './useComposedTableOptionsExtension';
import {
  PivotBuilderPanelContext,
  type PivotBuilderPanelContextValue,
} from './PivotBuilderPanelContext';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderPanelMiddleware'
);

/**
 * Panel-path middleware.
 *
 * The host `IrisGridPanel` constructs its own `IrisGridProxyModel`, so we
 * don't swap the model here. Instead we expose the panel's `metadata`
 * through `PivotBuilderPanelContext` so the sidebar `Create Pivot` page
 * can build a pivot in place against the host proxy via `setNextModel`.
 */
export function PivotBuilderPanelMiddleware({
  Component,
  ...props
}: WidgetMiddlewarePanelProps): JSX.Element {
  const extension = useComposedTableOptionsExtension();
  const panelContext = useMemo<PivotBuilderPanelContextValue>(
    () => ({ metadata: props.metadata }),
    [props.metadata]
  );
  log.debug('Wrapping panel component', {
    Component,
    metadata: props.metadata,
  });
  return (
    <PivotBuilderPanelContext.Provider value={panelContext}>
      <IrisGridTableOptionsContext.Provider value={extension}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...props} />
      </IrisGridTableOptionsContext.Provider>
    </PivotBuilderPanelContext.Provider>
  );
}

export default PivotBuilderPanelMiddleware;
