import { useCallback, useMemo } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven-enterprise/jsapi-coreplus-types';
import { useTheme } from '@deephaven/components';
import type { MouseHandlersProp } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import PivotColumnGroupMouseHandler from './PivotColumnGroupMouseHandler';
import PivotSortMouseHandler from './PivotSortMouseHandler';
import { IrisGridPivotRenderer } from './IrisGridPivotRenderer';
import { getIrisGridPivotTheme } from './IrisGridPivotTheme';
import { isCorePlusDh } from './PivotUtils';

const log = Log.module('@deephaven/js-plugin-pivot/usePivotTableUtils');

/**
 * Hook that creates a pivot table from a widget fetch function
 * @param fetch Function to fetch the widget
 * @returns Function that fetches and creates the pivot table
 */
export function usePivotTableFetch(
  fetch: () => Promise<dh.Widget>
): () => Promise<dh.coreplus.pivot.PivotTable> {
  const api = useApi();

  return useCallback(
    () =>
      fetch().then(widget => {
        log.debug('Pivot fetch result:', widget);
        if (!isCorePlusDh(api)) {
          throw new Error('CorePlus is not available');
        }
        const pivotTable = new api.coreplus.pivot.PivotTable(widget);
        log.debug('Created pivot table:', pivotTable);
        return pivotTable;
      }),
    [api, fetch]
  );
}

/**
 * Hook that creates mouse handlers for pivot grids
 * @returns Mouse handlers array
 */
export function usePivotMouseHandlers(): MouseHandlersProp {
  return useMemo(
    () => [
      irisGrid => new PivotColumnGroupMouseHandler(irisGrid),
      irisGrid => new PivotSortMouseHandler(irisGrid),
    ],
    []
  );
}

/**
 * Hook that creates a pivot grid renderer
 * @returns Pivot grid renderer
 */
export function usePivotRenderer(): IrisGridPivotRenderer {
  return useMemo(() => new IrisGridPivotRenderer(), []);
}

/**
 * Hook that gets the pivot theme based on current theme
 * @returns Pivot theme
 */
export function usePivotTheme(): ReturnType<typeof getIrisGridPivotTheme> {
  const theme = useTheme();

  return useMemo(() => {
    log.debug('Theme changed, updating pivot theme', theme);
    return getIrisGridPivotTheme();
  }, [theme]);
}
