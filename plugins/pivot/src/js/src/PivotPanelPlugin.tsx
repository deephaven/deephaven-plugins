import { forwardRef } from 'react';
import { WidgetPanelProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { IrisGridPanel } from '@deephaven/dashboard-core-plugins';
import useHydratePivotGrid from './useHydratePivotGrid';

export const PivotPanelPlugin = forwardRef<
  React.ComponentRef<typeof IrisGridPanel>,
  WidgetPanelProps<dh.Widget>
>((props: WidgetPanelProps<dh.Widget>, ref) => {
  const { localDashboardId, fetch, metadata } = props;

  console.log('[3] PivotPanelPlugin props', props);

  const hydratedProps = useHydratePivotGrid(fetch, localDashboardId, metadata);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <IrisGridPanel ref={ref} {...props} {...hydratedProps} />;
});

PivotPanelPlugin.displayName = 'PivotPanelPlugin';

export default PivotPanelPlugin;
