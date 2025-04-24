import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import { SimplePivotView } from './SimplePivotView';

// Register the plugin with Deephaven
export const SimplePivotPlugin: WidgetPlugin = {
  // The name of the plugin
  name: 'simple-pivot',
  // The type of plugin - this will generally be WIDGET_PLUGIN
  type: PluginType.WIDGET_PLUGIN,
  // The supported types for the plugin. This should match the value returned by `name`
  // in SimplePivotType in simple_pivot_type.py
  supportedTypes: 'SimplePivot',
  // The component to render for the plugin
  component: SimplePivotView,
  // The icon to display for the plugin
  icon: vsGraph,
};

export default SimplePivotPlugin;
