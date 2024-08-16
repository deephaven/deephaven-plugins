import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { vsGraph } from '@deephaven/icons';
import { MatplotlibView } from './MatplotlibView';

export const MatplotlibPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-matplotlib',
  title: 'Matplotlib Figure',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'matplotlib.figure.Figure',
  component: MatplotlibView,
  icon: vsGraph,
};

export default MatplotlibPlugin;
