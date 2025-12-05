import { forwardRef } from 'react';
import { WidgetPanelProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { IrisGridPanel } from '@deephaven/dashboard-core-plugins';
import useHydratePivotGrid from './useHydratePivotGrid';
import { LoadingOverlay } from '@deephaven/components';
import { getErrorMessage } from '@deephaven/utils';

// Unconnected IrisGridPanel type is not exported from dashboard-core-plugins
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PivotPanel = forwardRef<any, WidgetPanelProps<dh.Widget>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: WidgetPanelProps<dh.Widget>, ref: React.Ref<any>): JSX.Element => {
    const { localDashboardId, fetch, metadata } = props;

    const hydrateResult = useHydratePivotGrid(
      fetch,
      localDashboardId,
      metadata
    );

    if (hydrateResult.status === 'loading') {
      return <LoadingOverlay isLoading />;
    }

    if (hydrateResult.status === 'error') {
      return (
        <LoadingOverlay
          errorMessage={getErrorMessage(hydrateResult.error)}
          isLoading={false}
        />
      );
    }

    const { props: hydratedProps } = hydrateResult;

    return (
      <IrisGridPanel
        ref={ref}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...hydratedProps}
      />
    );
  }
);

PivotPanel.displayName = 'PivotPanel';

export default PivotPanel;
