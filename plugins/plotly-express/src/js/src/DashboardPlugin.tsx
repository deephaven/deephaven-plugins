import { useEffect } from 'react';
import { type DashboardPluginComponentProps } from '@deephaven/dashboard';
import PlotlyExpressChartPanel from './PlotlyExpressChartPanel.js';

export function DashboardPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  const { registerComponent } = props;

  // Register the PlotlyPanel for legacy panels created before the WidgetPlugin was being used.
  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        // The fetch does get passed through. This is for legacy purpose on Enterprise, not bothering to fix the types.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        registerComponent('PlotlyPanel', PlotlyExpressChartPanel as any),
      ];
      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [registerComponent]
  );

  return null;
}

export default DashboardPlugin;
