import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { dhTable } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { PivotWidget } from './PivotWidget';
import PivotPanelPlugin from './PivotPanelPlugin';

// Register the plugin with Deephaven
export const PivotPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-pivot',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'PivotTable',
  component: PivotWidget,
  panelComponent: PivotPanelPlugin,
  icon: dhTable,
  title: 'Pivot Table',
};

export default PivotPlugin;
