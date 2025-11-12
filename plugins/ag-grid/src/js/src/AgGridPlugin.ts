import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsTable } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { LicenseManager } from 'ag-grid-enterprise';
import { AgGridWidget } from './components';

const key = import.meta.env?.VITE_AG_GRID_LICENSE_KEY ?? '';
if (key != null && key !== '') {
  LicenseManager.setLicenseKey(key);
}

export const AgGridPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-ag-grid',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: ['deephaven.ag_grid.AgGrid'],
  component: AgGridWidget,
  icon: vsTable,
  title: 'AG Grid',
};

export default AgGridPlugin;
