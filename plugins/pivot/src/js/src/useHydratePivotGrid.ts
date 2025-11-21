import { useCallback, useMemo } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven-enterprise/jsapi-coreplus-types';
import {
  useLoadTablePlugin,
  type IrisGridPanelProps,
} from '@deephaven/dashboard-core-plugins';
import type { MouseHandlersProp } from '@deephaven/iris-grid';
import { useTheme } from '@deephaven/components';
import Log from '@deephaven/log';
import IrisGridPivotModel from './IrisGridPivotModel';
import { isCorePlusDh } from './PivotUtils';
import PivotColumnGroupMouseHandler from './PivotColumnGroupMouseHandler';
import { IrisGridPivotRenderer } from './IrisGridPivotRenderer';
import { getIrisGridPivotTheme } from './IrisGridPivotTheme';
import PivotFilterMouseHandler from './PivotFilterMouseHandler';
import PivotSortMouseHandler from './PivotSortMouseHandler';
import IrisGridPivotMetricCalculator from './IrisGridPivotMetricCalculator';

const log = Log.module('@deephaven/js-plugin-pivot/useHydratePivotGrid');

/**
 * Hydrate the props for a Pivot grid panel
 * @param fetch Function to fetch the Widget
 * @param id ID of the dashboard
 * @param metadata Optional serializable metadata for re-fetching the table later
 * @returns Props hydrated for a Pivot grid panel
 */
export function useHydratePivotGrid(
  fetch: () => Promise<dh.Widget>,
  id: string,
  metadata: dh.ide.VariableDescriptor | undefined
): { localDashboardId: string } & Pick<
  IrisGridPanelProps,
  'loadPlugin' | 'makeModel'
> {
  const api = useApi();
  const loadPlugin = useLoadTablePlugin();

  const fetchTable = useCallback(
    () =>
      fetch().then(result => {
        log.debug('Pivot fetch result:', result);
        if (!isCorePlusDh(api)) {
          throw new Error('CorePlus is not available');
        }
        const pivot = new api.coreplus.pivot.PivotTable(result);
        log.debug('Created pivot table:', pivot);
        return pivot;
      }),
    [api, fetch]
  );

  const mouseHandlers: MouseHandlersProp = useMemo(
    () => [
      irisGrid => new PivotColumnGroupMouseHandler(irisGrid),
      irisGrid => new PivotFilterMouseHandler(irisGrid),
      irisGrid => new PivotSortMouseHandler(irisGrid),
    ],
    []
  );

  const renderer = useMemo(() => new IrisGridPivotRenderer(), []);

  const theme = useTheme();

  const pivotTheme = useMemo(() => {
    log.debug('Theme changed, updating pivot theme', theme);
    return getIrisGridPivotTheme();
  }, [theme]);

  const getIrisGridPivotMetricCalculator = useCallback(
    (...args) => new IrisGridPivotMetricCalculator(...args),
    []
  );

  const hydratedProps = useMemo(
    () => ({
      loadPlugin,
      localDashboardId: id,
      makeModel: async () => {
        const pivotWidget = await fetchTable();
        return new IrisGridPivotModel(api, pivotWidget);
      },
      metadata,
      mouseHandlers,
      renderer,
      getMetricCalculator: getIrisGridPivotMetricCalculator,
    }),
    [
      api,
      fetchTable,
      id,
      loadPlugin,
      metadata,
      mouseHandlers,
      renderer,
      getIrisGridPivotMetricCalculator,
    ]
  );

  // Memoize the theme separately from the rest of the hydrated props
  // so that the the theme changes don't cause the model to be recreated
  const hydratedPropsWithTheme = useMemo(
    () => ({ ...hydratedProps, theme: pivotTheme }),
    [hydratedProps, pivotTheme]
  );

  return hydratedPropsWithTheme;
}

export default useHydratePivotGrid;
