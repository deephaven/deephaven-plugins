import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { dhTable } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { SimplePivotWidget } from './SimplePivotWidget';

// Register the plugin with Deephaven
export const SimplePivotPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-simple-pivot',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'simplepivot.SimplePivotTable',
  component: SimplePivotWidget,
  icon: dhTable,
  title: 'Simple Pivot',
};

export default SimplePivotPlugin;
