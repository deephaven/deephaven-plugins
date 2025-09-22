import { WidgetPanelProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { IrisGridPanel } from '@deephaven/dashboard-core-plugins';
import useHydratePivotGrid from './useHydratePivotGrid';

export const PivotPanelPlugin = (props: WidgetPanelProps<dh.Widget>) => {
  const { localDashboardId, fetch, metadata } = props;

  const hydratedProps = useHydratePivotGrid(fetch, localDashboardId, metadata);

  return (
    <IrisGridPanel
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...hydratedProps}
    />
  );
};

PivotPanelPlugin.COMPONENT = 'PivotPanel';

export default PivotPanelPlugin;
