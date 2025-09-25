import { forwardRef } from 'react';
import { WidgetPanelProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { IrisGridPanel, IrisGridType } from '@deephaven/dashboard-core-plugins';
import useHydratePivotGrid from './useHydratePivotGrid';

export const PivotPanel = forwardRef(
  (
    props: WidgetPanelProps<dh.Widget>,
    ref: React.Ref<IrisGridType>
  ): JSX.Element => {
    const { localDashboardId, fetch, metadata } = props;

    const hydratedProps = useHydratePivotGrid(
      fetch,
      localDashboardId,
      metadata
    );

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

PivotPanel.COMPONENT = 'PivotPanel';

PivotPanel.displayName = 'PivotPanel';

export default PivotPanel;
