import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import { MatplotlibView } from './MatplotlibView';
import { MatplotlibPanel } from './MatplotlibPanel';

export const MatplotlibPlugin: WidgetPlugin = {
  name: '@deephaven/js-plugin-matplotlib',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'matplotlib.figure.Figure',
  component: MatplotlibView,
  panelComponent: MatplotlibPanel,
  icon: vsGraph,
};

export default MatplotlibPlugin;
