import { useEffect, useState } from 'react';
import { useApi, useObjectFetch } from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven-enterprise/jsapi-coreplus-types';
import {
  useLoadTablePlugin,
  type IrisGridPanelProps,
} from '@deephaven/dashboard-core-plugins';
import { assertNotNull } from '@deephaven/utils';
import Log from '@deephaven/log';
import IrisGridPivotModel from './IrisGridPivotModel';
import { isCorePlusDh } from './PivotUtils';
import {
  usePivotMouseHandlers,
  usePivotRenderer,
  usePivotTheme,
} from './usePivotTableUtils';

const log = Log.module('@deephaven/js-plugin-pivot/useHydratePivotGrid');

export interface HydratePivotGridResultLoading {
  status: 'loading';
}

export interface HydratePivotGridResultError {
  status: 'error';
  error: NonNullable<unknown>;
}

export interface HydratePivotGridResultSuccess {
  hydratedProps: { localDashboardId: string } & Pick<
    IrisGridPanelProps,
    'loadPlugin' | 'makeModel'
  >;
  status: 'success';
}

export type HydratePivotGridResult =
  | HydratePivotGridResultLoading
  | HydratePivotGridResultError
  | HydratePivotGridResultSuccess;

/**
 * Hydrate the props for a Pivot grid panel
 * @param id ID of the dashboard
 * @param metadata Optional serializable metadata for re-fetching the table later
 * @returns Props hydrated for a Pivot grid panel
 */
export function useHydratePivotGrid(
  id: string,
  metadata: dh.ide.VariableDescriptor | undefined
): HydratePivotGridResult {
  assertNotNull(metadata, 'Missing Pivot metadata');

  const [wrapper, setWrapper] = useState<HydratePivotGridResult>({
    status: 'loading',
  });

  const api = useApi();
  const loadPlugin = useLoadTablePlugin();
  const objectFetch = useObjectFetch<dh.Widget>(metadata);
  const mouseHandlers = usePivotMouseHandlers();
  const renderer = usePivotRenderer();
  const pivotTheme = usePivotTheme();

  useEffect(() => {
    const { status } = objectFetch;

    if (status === 'loading') {
      log.debug('Widget is loading');
      setWrapper({ status: 'loading' });
      return;
    }

    if (status === 'error') {
      log.debug('Error fetching widget:', objectFetch.error);
      setWrapper({
        status: 'error',
        error: objectFetch.error,
      });
      return;
    }

    const { fetch: fetchWidget } = objectFetch;

    const hydratedProps = {
      loadPlugin,
      localDashboardId: id,
      makeModel: async () => {
        log.debug('Fetching pivot widget');
        const widget = await fetchWidget();
        log.debug('Pivot fetch result:', widget);
        if (!isCorePlusDh(api)) {
          throw new Error('CorePlus is not available');
        }
        const pivotTable = new api.coreplus.pivot.PivotTable(widget);
        log.debug('Created pivot table:', pivotTable);
        return new IrisGridPivotModel(api, pivotTable);
      },
      metadata,
      mouseHandlers,
      renderer,
      theme: pivotTheme,
    };

    setWrapper({
      status: 'success',
      hydratedProps,
    });
  }, [
    api,
    loadPlugin,
    metadata,
    objectFetch,
    id,
    mouseHandlers,
    pivotTheme,
    renderer,
  ]);

  return wrapper;
}

export default useHydratePivotGrid;
