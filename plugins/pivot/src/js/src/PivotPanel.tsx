import { WidgetPanelProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { IrisGridPanel } from '@deephaven/dashboard-core-plugins';
import useHydratePivotGrid from './useHydratePivotGrid';

function PivotPanel(props: WidgetPanelProps<dh.Widget>): JSX.Element {
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
}

PivotPanel.COMPONENT = 'PivotPanel';

export default PivotPanel;
