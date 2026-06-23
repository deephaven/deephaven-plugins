import { PluginType } from '@deephaven/plugin';
import { PlotlyExpressPlugin } from './PlotlyExpressPlugin.js';
import { DashboardPlugin } from './DashboardPlugin.js';

// Export legacy dashboard plugin as named export for backwards compatibility
export * from './DashboardPlugin.js';
export * from './PlotlyExpressChartModel.js';
export * from './PlotlyExpressChartUtils.js';

const PlotlyExpressDashboardPlugin = {
  name: '@deephaven/js-plugin-plotly-express.DashboardPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: DashboardPlugin,
};

const PlotlyExpressMultiPlugin = {
  name: '@deephaven/js-plugin-plotly-express',
  type: PluginType.MULTI_PLUGIN,
  plugins: [PlotlyExpressPlugin, PlotlyExpressDashboardPlugin],
};

export default PlotlyExpressMultiPlugin;
