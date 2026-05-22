import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IrisGrid,
  IrisGridTableOptionsContext,
  type IrisGridModel,
} from '@deephaven/iris-grid';
import { LoadingOverlay } from '@deephaven/components';
import { useApi, useObjectFetch } from '@deephaven/jsapi-bootstrap';
import { isCorePlusDh } from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { WidgetMiddlewareComponentProps } from '@deephaven/plugin';
import PivotBuilderIrisGridModel from './PivotBuilderIrisGridModel';
import { useComposedTableOptionsExtension } from './useComposedTableOptionsExtension';

const log = Log.module('@deephaven/js-plugin-pivot-builder/PivotBuilderWidget');

/**
 * Replaces the default Table widget renderer with an `IrisGrid` driven by
 * a `PivotBuilderIrisGridModel`. The proxy model swaps its inner model
 * when `pivotConfig` is written from the sidebar.
 */
export function PivotBuilderWidget({
  fetch,
  metadata,
}: WidgetMiddlewareComponentProps<DhType.Table>): JSX.Element {
  const dh = useApi();
  const extension = useComposedTableOptionsExtension();
  const [model, setModel] = useState<IrisGridModel | null>(null);
  const [error, setError] = useState<unknown>(null);
  const builtModelRef = useRef<PivotBuilderIrisGridModel | null>(null);

  // Subscribe to the well-known `psp` PivotService on the same query.
  const pspDescriptor = useMemo<DhType.ide.VariableDescriptor>(() => {
    if (!isCorePlusDh(dh) || metadata == null) {
      // Use a sentinel name so ObjectFetchManager stays inert when unavailable.
      return { type: 'PivotService', name: '__unavailable__' };
    }
    return { ...metadata, type: 'PivotService', name: 'psp' };
  }, [dh, metadata]);
  const pspFetch = useObjectFetch<DhType.Widget>(pspDescriptor);

  useEffect(() => {
    let cancelled = false;
    setModel(null);
    setError(null);

    if (!isCorePlusDh(dh)) {
      setError(
        new Error('CorePlus API not available; pivot builder requires DHE')
      );
      return undefined;
    }
    if (pspFetch.status !== 'ready') {
      // Wait for psp to resolve before fetching the table.
      return undefined;
    }

    (async () => {
      try {
        const [table, pspWidget] = await Promise.all([
          fetch(),
          pspFetch.fetch(),
        ]);
        if (cancelled) {
          table?.close?.();
          return;
        }
        const built = new PivotBuilderIrisGridModel(
          dh,
          table,
          pspWidget as DhType.Widget
        );
        builtModelRef.current = built;
        setModel(built);
      } catch (e) {
        if (cancelled) return;
        log.error('Failed to build pivot builder model', e);
        setError(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch, pspFetch]);

  // Close the model when the component unmounts or is replaced.
  useEffect(
    () => () => {
      builtModelRef.current?.close();
      builtModelRef.current = null;
    },
    []
  );

  if (error != null) {
    return (
      <LoadingOverlay
        errorMessage={error instanceof Error ? error.message : String(error)}
      />
    );
  }
  if (model == null) {
    return <LoadingOverlay />;
  }

  return (
    <IrisGridTableOptionsContext.Provider value={extension}>
      <IrisGrid model={model} />
    </IrisGridTableOptionsContext.Provider>
  );
}

export default PivotBuilderWidget;
