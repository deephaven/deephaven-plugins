import { useCallback } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven-enterprise/jsapi-coreplus-types';
import Log from '@deephaven/log';
import { isCorePlusDh } from '../PivotUtils';

const log = Log.module('@deephaven/js-plugin-pivot/usePivotTableFetch');

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

export default usePivotTableFetch;
