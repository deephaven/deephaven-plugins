import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import type { Widget } from '@deephaven/jsapi-types';
import { PlotlyExpressChart } from './PlotlyExpressChart.js';
import { PlotlyExpressChartPanel } from './PlotlyExpressChartPanel.js';

export const PlotlyExpressPlugin: WidgetPlugin<Widget> = {
  name: '@deephaven/plotly-express',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'deephaven.plot.express.DeephavenFigure',
  component: PlotlyExpressChart,
  panelComponent: PlotlyExpressChartPanel,
  icon: vsGraph,
};

export default PlotlyExpressPlugin;
