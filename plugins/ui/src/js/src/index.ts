import { PluginType } from '@deephaven/plugin';
import { UIWidgetPlugin } from './UIWidgetPlugin';
import { DashboardPlugin } from './DashboardPlugin';

const UIDashboardPlugin = {
  name: '@deephaven/js-plugin-ui.DashboardPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: DashboardPlugin,
};

const UIMultiPlugin = {
  name: '@deephaven/js-plugin-ui',
  type: PluginType.MULTI_PLUGIN,
  plugins: [UIWidgetPlugin, UIDashboardPlugin],
};

export { DashboardPlugin };

export default UIMultiPlugin;
