import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import { PythonRemoteFileSourcePluginView } from './PythonRemoteFileSourcePluginView';

// Register the plugin with Deephaven
export const PythonRemoteFileSourcePlugin: WidgetPlugin = {
  // The name of the plugin
  name: '@deephaven/js-plugin-python-remote-file-source',
  // The type of plugin - this will generally be WIDGET_PLUGIN
  type: PluginType.WIDGET_PLUGIN,
  // The supported types for the plugin. This should match the value returned by `name`
  // in PluginType in plugin_type.py
  supportedTypes: 'DeephavenPythonRemoteFileSourcePlugin',
  // The component to render for the plugin
  component: PythonRemoteFileSourcePluginView,
  // The icon to display for the plugin
  icon: vsGraph,
};

export default PythonRemoteFileSourcePlugin;
