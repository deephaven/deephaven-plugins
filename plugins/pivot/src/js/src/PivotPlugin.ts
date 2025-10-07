import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { dhTable } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { PivotWidget } from './PivotWidget';
import PivotPanel from './PivotPanel';

// Register the plugin with Deephaven
export const PivotPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-pivot',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'PivotTable',
  component: PivotWidget,
  panelComponent: PivotPanel,
  icon: dhTable,
  title: 'Pivot Table',
};

export default PivotPlugin;
