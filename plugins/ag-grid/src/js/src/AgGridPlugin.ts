import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsTable } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { LicenseManager } from '@ag-grid-enterprise/core';
import { AgGridWidget } from './AgGridWidget';

try {
  const { env } = import.meta;
  const key = env?.VITE_AG_GRID_LICENSE_KEY ?? '';
  if (key != null && key !== '') {
    LicenseManager.setLicenseKey(key);
  }
} catch (error) {
  // We can just ignore this error if the license key is not set or invalid. AG Grid will log an error, and consumers should be adding their own license key.
}

export const AgGridPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-ag-grid',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'deephaven.ag_grid.AgGrid',
  component: AgGridWidget,
  icon: vsTable,
  title: 'AG Grid',
};

export default AgGridPlugin;
