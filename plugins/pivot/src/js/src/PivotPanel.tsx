import { type dh } from '@deephaven/jsapi-types';
import { LoadingOverlay } from '@deephaven/components';
import {
  IrisGridPanel,
  type IrisGridPanelProps,
} from '@deephaven/dashboard-core-plugins';
import { getErrorMessage } from '@deephaven/utils';
import type { DashboardPanelProps } from '@deephaven/dashboard';
import { type Ref, type ForwardRefExoticComponent, forwardRef } from 'react';
import useHydratePivotGrid from './useHydratePivotGrid';
import type { WidgetPanelProps } from '@deephaven/plugin';

export const PivotPanel = forwardRef(
  (panelProps: WidgetPanelProps<dh.Widget>, ref: React.Ref<any>) => {
    const { localDashboardId, metadata, panelState, ...props } =
      panelProps as DashboardPanelProps & {
        metadata?: dh.ide.VariableDescriptor;
        panelState?: IrisGridPanelProps['panelState'];
      };

    const hydrateResult = useHydratePivotGrid(localDashboardId, metadata);

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
        panelState={panelState}
      />
    );
  }
);

PivotPanel.displayName = 'PivotPanel';

export default PivotPanel;
