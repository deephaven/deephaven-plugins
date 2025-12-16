import { type WidgetComponentProps } from '@deephaven/plugin';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { IrisGrid } from '@deephaven/iris-grid';
import { LoadingOverlay } from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';
import { useIrisGridPivotModel } from './useIrisGridPivotModel';
import { usePivotTableFetch } from './hooks/usePivotTableFetch';
import { usePivotMouseHandlers } from './hooks/usePivotMouseHandlers';
import { usePivotRenderer } from './hooks/usePivotRenderer';
import { usePivotTheme } from './hooks/usePivotTheme';

export function PivotWidget({
  fetch,
}: WidgetComponentProps<DhType.Widget>): JSX.Element | null {
  const pivotFetch = usePivotTableFetch(fetch);
  const mouseHandlers = usePivotMouseHandlers();
  const renderer = usePivotRenderer();
  const pivotTheme = usePivotTheme();

  const fetchResult = useIrisGridPivotModel(pivotFetch);

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
      getMetricCalculator={getIrisGridPivotMetricCalculator}
    />
  );
}

export default PivotWidget;
