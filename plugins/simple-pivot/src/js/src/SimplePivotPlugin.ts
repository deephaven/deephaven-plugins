import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { dhTable } from '@deephaven/icons';
import { SimplePivotWidget } from './SimplePivotWidget';

// Register the plugin with Deephaven
export const SimplePivotPlugin: WidgetPlugin = {
  name: '@deephaven/js-plugin-simple-pivot',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'simplepivot.SimplePivotTable',
  component: SimplePivotWidget,
  icon: dhTable,
  title: 'Simple Pivot',
};

export default SimplePivotPlugin;
