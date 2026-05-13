import type { WidgetDescriptor } from '@deephaven/dashboard';
import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { DASHBOARD_ELEMENT, WIDGET_ELEMENT } from './widget/WidgetUtils';
import PortalPanel from './layout/PortalPanel';
import UIWidget from './UIWidget';

export const DASHBOARD_PLUGIN_NAME = '@deephaven/js-plugin-ui.DashboardPlugin';

/**
 * Plugin for rendering deephaven.ui widgets, such as Element or Dashboard.
 * PortalPanels are registered as they are used by the legacy DashboardPlugin to render elements.
 */
export const UIWidgetPlugin: WidgetPlugin<dh.Widget> & {
  // TODO: Remove these extra types when it's updated in web-client-ui
  dashboardTypes: string[];
  createDashboardPayload: (widget: WidgetDescriptor) => unknown;
} = {
  name: '@deephaven/js-plugin-ui',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: [WIDGET_ELEMENT, DASHBOARD_ELEMENT, PortalPanel.displayName],
  component: UIWidget,
  icon: vsGraph,

  dashboardTypes: [DASHBOARD_ELEMENT],
  createDashboardPayload: (widget: WidgetDescriptor) => ({
    pluginId: DASHBOARD_PLUGIN_NAME,
    title: widget?.name ?? 'Untitled',
    data: { openWidgets: { [DASHBOARD_PLUGIN_NAME]: { descriptor: widget } } },
  }),
};

export default UIWidgetPlugin;
