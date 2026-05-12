import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { DASHBOARD_ELEMENT, WIDGET_ELEMENT } from './widget/WidgetUtils';
import PortalPanel from './layout/PortalPanel';
import UIWidget from './UIWidget';

/**
 * Plugin for rendering deephaven.ui widgets, such as Element or Dashboard.
 * PortalPanels are registered as they are used by the legacy DashboardPlugin to render elements.
 */
export const UIWidgetPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-ui',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: [WIDGET_ELEMENT, DASHBOARD_ELEMENT, PortalPanel.displayName],
  component: UIWidget,
  icon: vsGraph,
};

export default UIWidgetPlugin;
