import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsTable } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { LicenseManager } from '@ag-grid-enterprise/core';
import { AgGridWidget } from './AgGridWidget';

LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY ?? '');

export const AgGridPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-ag-grid',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'deephaven.ag_grid.AgGrid',
  component: AgGridWidget,
  icon: vsTable,
  title: 'AG Grid',
};

export default AgGridPlugin;
