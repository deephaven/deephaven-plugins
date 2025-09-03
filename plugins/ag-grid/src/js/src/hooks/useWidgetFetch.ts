import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import Log from '@deephaven/log';
import { useEffect, useState } from 'react';
import AgGridTableType from '../AgGridTableType';
import { isCorePlusDhType } from '../utils/CorePlusUtils';

const log = Log.module('@deephaven/js-plugin-ag-grid/hooks/useWidgetFetch');

export function useWidgetFetch(
  dh: typeof DhType | typeof CorePlusDhType,
  fetch: () => Promise<DhType.Widget>
): AgGridTableType | undefined {
  const [table, setTable] = useState<AgGridTableType>();

  /** First we load the widget object. This is the object that is sent from the server in AgGridMessageStream. */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      log.debug('Fetching widget');
      const widget: DhType.Widget = await fetch();
      log.debug('Fetched widget of type', widget.type);
      switch (widget.type) {
        case 'deephaven.ag_grid.AgGrid': {
          const newTable =
            (await widget.exportedObjects[0].fetch()) as DhType.Table;
          if (!cancelled) {
            log.info('Loaded table', newTable);
            setTable(newTable);
          }
          break;
        }
        case 'PivotTable': {
          if (!isCorePlusDhType(dh)) {
            throw new Error(
              'PivotTable widget is only supported in Core Plus builds'
            );
          }
          if (!cancelled) {
            const pivotTable = new dh.coreplus.pivot.PivotTable(widget);
            setTable(pivotTable);
          }
          break;
        }
        case dh.VariableType.TABLE:
        case dh.VariableType.TREETABLE:
        case dh.VariableType.HIERARCHICALTABLE: {
          if (!cancelled) {
            log.info('Loaded table', widget);
            setTable(widget as unknown as AgGridTableType);
          }
          break;
        }
        default:
          throw new Error(`Unsupported widget type: ${widget.type}`);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch]);

  return table;
}

export default useWidgetFetch;
