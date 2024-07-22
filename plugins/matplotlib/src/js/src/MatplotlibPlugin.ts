import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import { MatplotlibView } from './MatplotlibView';

export const MatplotlibPlugin: WidgetPlugin = {
  name: 'MatPlotLibPanel',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'matplotlib.figure.Figure',
  component: MatplotlibView,
  icon: vsGraph,
};

export default MatplotlibPlugin;
