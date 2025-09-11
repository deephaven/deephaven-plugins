import { useCallback, useMemo, useRef } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { IrisGrid, type IrisGridType } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { LoadingOverlay } from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';
import Log from '@deephaven/log';
import { useIrisGridPivotModel } from './useIrisGridPivotModel';
import PivotColumnGroupMouseHandler from './PivotColumnGroupMouseHandler';
import { isCorePlusDh } from './PivotUtils';
import IrisGridPivotRenderer from './IrisGridPivotRenderer';

const log = Log.module('@deephaven/js-plugin-pivot/PivotWidget');

export function PivotWidget({
  fetch,
}: WidgetComponentProps<DhType.Widget>): React.ReactElement | null {
  const dh = useApi();

  const irisGridRef = useRef<IrisGridType>(null);

  const toggleExpandColumn = useCallback((column: number) => {
    irisGridRef.current?.toggleExpandColumn(column);
  }, []);

  const mouseHandlers = useMemo(
    () => [new PivotColumnGroupMouseHandler(toggleExpandColumn)],
    [toggleExpandColumn]
  );

  const renderer = useMemo(() => new IrisGridPivotRenderer(), []);

  const pivotTableFetch = useCallback(
    () =>
      fetch().then(result => {
        log.debug('pivotWidget fetch result:', result);
        if (!isCorePlusDh(dh)) {
          throw new Error('CorePlus is not available');
        }
        const pivot = new dh.coreplus.pivot.PivotTable(result);
        log.debug('Created pivot table:', pivot);
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

  return (
    <IrisGrid
      model={model}
      mouseHandlers={mouseHandlers}
      renderer={renderer}
      ref={irisGridRef as React.RefObject<IrisGridType>}
    />
  );
}

export default PivotWidget;
