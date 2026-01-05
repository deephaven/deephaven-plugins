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
import { usePivotMouseHandlers } from './hooks/usePivotMouseHandlers';
import { usePivotRenderer } from './hooks/usePivotRenderer';
import { usePivotTheme } from './hooks/usePivotTheme';
import usePivotMetricCalculator from './hooks/usePivotMetricCalculator';

const log = Log.module('@deephaven/js-plugin-pivot/useHydratePivotGrid');

export interface HydratePivotGridResultLoading {
  status: 'loading';
}

export interface HydratePivotGridResultError {
  status: 'error';
  error: NonNullable<unknown>;
}

export interface HydratePivotGridResultSuccess {
  props: { localDashboardId: string } & Pick<
    IrisGridPanelProps,
    | 'getMetricCalculator'
    | 'loadPlugin'
    | 'makeModel'
    | 'metadata'
    | 'mouseHandlers'
    | 'renderer'
    | 'theme'
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

  // Manage loading and error states
  const objectFetch = useObjectFetch<dh.Widget>(metadata);
  const api = useApi();
  const loadPlugin = useLoadTablePlugin();
  const mouseHandlers = usePivotMouseHandlers();
  const renderer = usePivotRenderer();
  const theme = usePivotTheme();
  const getMetricCalculator = usePivotMetricCalculator();

  const { status } = objectFetch;

  if (status === 'loading') {
    log.debug('Widget is loading');
    return { status: 'loading' };
  }

  if (status === 'error') {
    log.debug('Error fetching widget:', objectFetch.error);
    return {
      status: 'error',
      error: objectFetch.error,
    };
  }

  const { fetch } = objectFetch;

  return {
    status: 'success',
    props: {
      loadPlugin,
      localDashboardId: id,
      makeModel: async function makeModel() {
        log.debug('Fetching pivot widget');
        const widget = await fetch();
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
      theme,
      getMetricCalculator,
    },
  };
}

export default useHydratePivotGrid;
