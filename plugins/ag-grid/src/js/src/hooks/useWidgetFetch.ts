import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import Log from '@deephaven/log';
import { useEffect, useState } from 'react';
import { isCorePlusDhType } from '../utils/CorePlusUtils';
import { type AgGridTableType, type AgGridWidgetOptions } from '../types';

const log = Log.module('@deephaven/js-plugin-ag-grid/hooks/useWidgetFetch');

function isWidget(obj: unknown): obj is DhType.Widget {
  return (
    obj != null &&
    typeof obj === 'object' &&
    'exportedObjects' in obj &&
    'type' in obj &&
    typeof (obj as DhType.Widget).type === 'string'
  );
}

const PIVOT_TABLE_WIDGET_TYPE = 'PivotTable';

/** Parse the options JSON sent from the server. Older servers send an empty payload. */
function parseOptions(widget: DhType.Widget): AgGridWidgetOptions {
  const data = widget.getDataAsString();
  if (data === '') {
    return {};
  }
  return JSON.parse(data);
}

export type WidgetFetchResult = {
  table: AgGridTableType;
  options: AgGridWidgetOptions;
};

export function useWidgetFetch(
  dh: typeof DhType | typeof CorePlusDhType,
  fetch: () => Promise<DhType.Widget>
): WidgetFetchResult | undefined {
  const [result, setResult] = useState<WidgetFetchResult>();

  /** First we load the widget object. This is the object that is sent from the server in AgGridMessageStream. */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      log.debug('Fetching widget');
      const widget: DhType.Widget = await fetch();
      log.debug('Fetched widget of type', widget.type);
      switch (widget.type) {
        case 'deephaven.ag_grid.AgGrid': {
          const options = parseOptions(widget);
          let newTable = await widget.exportedObjects[0].fetch();
          if (isWidget(newTable)) {
            if (newTable.type !== PIVOT_TABLE_WIDGET_TYPE) {
              throw new Error(
                `AgGrid widget contains unsupported widget type: ${newTable.type}`
              );
            }
            if (!isCorePlusDhType(dh)) {
              throw new Error(
                'PivotTable widget is only supported in Core Plus builds'
              );
            }
            newTable = new dh.coreplus.pivot.PivotTable(newTable);
          }
          if (!cancelled) {
            log.info('Loaded table', newTable, 'with options', options);
            setResult({ table: newTable, options });
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

  return result;
}

export default useWidgetFetch;
