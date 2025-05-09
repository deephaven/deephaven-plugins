import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsTable } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { LicenseManager } from '@ag-grid-enterprise/core';
import { AgGridWidget } from './AgGridWidget';

LicenseManager.setLicenseKey(
  '[TRIAL]_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-086014}_is_granted_for_evaluation_only___Use_in_production_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_purchasing_a_production_key_please_contact_info@ag-grid.com___You_are_granted_a_{Single_Application}_Developer_License_for_one_application_only___All_Front-End_JavaScript_developers_working_on_the_application_would_need_to_be_licensed___This_key_will_deactivate_on_{31 May 2025}____[v3]_[0102]_MTc0ODY0NjAwMDAwMA==7abf5fba5a75fd650d0f77a996115910'
);

export const AgGridPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-ag-grid',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'deephaven.ag_grid.AgGrid',
  component: AgGridWidget,
  icon: vsTable,
  title: 'AG Grid',
};

export default AgGridPlugin;
