import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsTable } from '@deephaven/icons';
import type { Widget } from '@deephaven/jsapi-types';
import AgGridView from './AgGridView';

export const AgGridPlugin: WidgetPlugin<Widget> = {
  name: '@deephaven/js-plugin-ag-grid',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'deephaven.aggrid.AgGrid',
  component: AgGridView,
  icon: vsTable,
};

export default AgGridPlugin;
