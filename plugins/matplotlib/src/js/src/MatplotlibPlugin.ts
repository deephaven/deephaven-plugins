import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import { MatplotlibView } from './MatplotlibView';
import { MatplotlibPanel } from './MatplotlibPanel';

export const PlotlyExpressPlugin: WidgetPlugin = {
  name: '@deephaven/plotly-express',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'deephaven.plot.express.DeephavenFigure',
  component: MatplotlibView,
  panelComponent: MatplotlibPanel,
  icon: vsGraph,
};

export default PlotlyExpressPlugin;
