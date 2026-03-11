import { PluginType } from '@deephaven/plugin';
import { UIWidgetPlugin } from './UIWidgetPlugin';
import { DashboardPlugin } from './DashboardPlugin';

// TODO: Remove local MultiPlugin type once @deephaven/plugin is updated
// to include it (see deephaven/web-client-ui composite-plugins branch)
const MULTI_PLUGIN = 'MultiPlugin' as const;

const UIDashboardPlugin = {
  name: '@deephaven/js-plugin-ui.DashboardPlugin',
  type: PluginType.DASHBOARD_PLUGIN as string,
  component: DashboardPlugin,
};

const UIMultiPlugin = {
  name: '@deephaven/js-plugin-ui',
  type: MULTI_PLUGIN as string,
  plugins: [UIWidgetPlugin, UIDashboardPlugin],
};

export { DashboardPlugin };

export default UIMultiPlugin;
