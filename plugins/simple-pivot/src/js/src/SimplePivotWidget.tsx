import { useCallback } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { IrisGrid } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { LoadingOverlay } from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';
import {
  useIrisGridSimplePivotModel,
  type SimplePivotFetchResult,
} from './useIrisGridSimplePivotModel';
import {
  getSimplePivotColumnMap,
  KEY_TABLE_PIVOT_COLUMN,
  type KeyColumnArray,
  type KeyTableSubscriptionData,
} from './SimplePivotUtils';

export function SimplePivotWidget({
  fetch,
}: WidgetComponentProps<DhType.Widget>): JSX.Element | null {
  const dh = useApi();
  const loadKeys = useCallback(
    (keyTable: DhType.Table): Promise<KeyColumnArray> =>
      new Promise((resolve, reject) => {
        const pivotIdColumn = keyTable.findColumn(KEY_TABLE_PIVOT_COLUMN);
        const columns = keyTable.columns.filter(
          c => c.name !== KEY_TABLE_PIVOT_COLUMN
        );
        const subscription = keyTable.subscribe(keyTable.columns);
        subscription.addEventListener<KeyTableSubscriptionData>(
          dh.Table.EVENT_UPDATED,
          e => {
            subscription.close();
            resolve(getSimplePivotColumnMap(e.detail, columns, pivotIdColumn));
          }
        );
      }),
    [dh]
  );

  const fetchTable = useCallback(
    async function fetchModel() {
      const pivotWidget = await fetch();
      const schema = JSON.parse(pivotWidget.getDataAsString());

      // The initial state is our keys to use for column headers
      const keyTablePromise = pivotWidget.exportedObjects[0].fetch();
      const columnMapPromise = keyTablePromise.then(loadKeys);

      return new Promise<SimplePivotFetchResult>((resolve, reject) => {
        // Add a listener for each pivot schema change, so we get the first update, with the table to render.
        // Note that there is no await between this line and the pivotWidget being returned, or we would miss the first update
        const removeEventListener = pivotWidget.addEventListener<DhType.Widget>(
          dh.Widget.EVENT_MESSAGE,
          async e => {
            removeEventListener();
            const data = e.detail.getDataAsString();
            const response = JSON.parse(data === '' ? '{}' : data);
            if (response.error != null) {
              reject(new Error(response.error));
              return;
            }
            // Get the object, and make sure the keytable is fetched and usable
            const tables = e.detail.exportedObjects;
            const tableToRenderPromise = tables[0].fetch();
            const totalsPromise =
              tables.length === 2 ? tables[1].fetch() : Promise.resolve(null);

            // Wait for all four promises to have resolved, then render the table. Note that after
            // the first load, the keytable will remain loaded, we'll only wait for the main table,
            // and optionally the totals table.
            const fetchResult = await Promise.all([
              tableToRenderPromise,
              totalsPromise,
              keyTablePromise,
              columnMapPromise,
            ]).then(([table, totalsTable, keyTable, columnMap]) => ({
              table,
              totalsTable,
              keyTable,
              columnMap,
            }));
            resolve({ ...fetchResult, schema, pivotWidget });
          }
        );
      });
    },
    [fetch, dh, loadKeys]
  );

  const fetchResult = useIrisGridSimplePivotModel(fetchTable);

  if (fetchResult.status === 'loading') {
    return <LoadingOverlay isLoading />;
  }

  if (fetchResult.status === 'error') {
    return (
      <LoadingOverlay
        errorMessage={getErrorMessage(fetchResult.error)}
        isLoading={false}
      />
    );
  }

  const { model } = fetchResult;

  return <IrisGrid model={model} />;
}

export default SimplePivotWidget;
