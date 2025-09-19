import { forwardRef } from 'react';
import { WidgetPanelProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { IrisGridPanel } from '@deephaven/dashboard-core-plugins';
import Log from '@deephaven/log';
import useHydratePivotGrid from './useHydratePivotGrid';

const log = Log.module('@deephaven/js-plugin-pivot/PivotPanelPlugin');

export const PivotPanelPlugin = forwardRef<
  React.ComponentRef<typeof IrisGridPanel>,
  WidgetPanelProps<dh.Widget>
>((props: WidgetPanelProps<dh.Widget>, ref) => {
  const { localDashboardId, fetch, metadata } = props;

  const hydratedProps = useHydratePivotGrid(fetch, localDashboardId, metadata);

  return (
    <IrisGridPanel
      ref={ref}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...hydratedProps}
    />
  );
});

PivotPanelPlugin.displayName = 'PivotPanelPlugin';

export default PivotPanelPlugin;
