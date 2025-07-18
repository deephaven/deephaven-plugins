import { useCallback } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type dh as DhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { IrisGrid } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { LoadingOverlay } from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';
import Log from '@deephaven/log';
import { useIrisGridPivotModel } from './useIrisGridPivotModel';

const log = Log.module('@deephaven/js-plugin-pivot/PivotWidget');

export function PivotWidget({
  fetch,
}: WidgetComponentProps<DhType.Widget>): JSX.Element | null {
  const dh = useApi();

  const pivotTableFetch = useCallback(
    () =>
      fetch().then(result => {
        log.debug('pivotWidget fetch result:', result);
        const pivot = new dh.coreplus.pivot.PivotTable(result);
        log.debug('pivot:', pivot);
        return pivot;
      }),
    [dh, fetch]
  );

  const fetchResult = useIrisGridPivotModel(pivotTableFetch);

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

export default PivotWidget;
