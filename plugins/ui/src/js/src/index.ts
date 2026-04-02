import { PluginType } from '@deephaven/plugin';
import { UIWidgetPlugin } from './UIWidgetPlugin';
import { DashboardPlugin } from './DashboardPlugin';
import styles from './styles.scss?inline';

// We need to inject the styles into the document when we're loaded... we only want to do this once.
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

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
