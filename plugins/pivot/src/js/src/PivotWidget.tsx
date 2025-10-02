import { useCallback, useMemo } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { IrisGrid, type MouseHandlersProp } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  LoadingOverlay,
  resolveCssVariablesInRecord,
  useTheme,
} from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';
import Log from '@deephaven/log';
import { useIrisGridPivotModel } from './useIrisGridPivotModel';
import PivotColumnGroupMouseHandler from './PivotColumnGroupMouseHandler';
import { isCorePlusDh } from './PivotUtils';
import IrisGridPivotRenderer from './IrisGridPivotRenderer';
import IrisGridPivotTheme from './IrisGridPivotTheme';

const log = Log.module('@deephaven/js-plugin-pivot/PivotWidget');

export function PivotWidget({
  fetch,
}: WidgetComponentProps<DhType.Widget>): JSX.Element | null {
  const dh = useApi();

  const mouseHandlers: MouseHandlersProp = useMemo(
    () => [irisGrid => new PivotColumnGroupMouseHandler(irisGrid)],
    []
  );

  const renderer = useMemo(() => new IrisGridPivotRenderer(), []);

  const theme = useTheme();

  const pivotTheme = useMemo(() => {
    log.debug('Theme changed, updating pivot theme', theme);
    return resolveCssVariablesInRecord(IrisGridPivotTheme);
  }, [theme]);

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
      theme={pivotTheme}
    />
  );
}

export default PivotWidget;
