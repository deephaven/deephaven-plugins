import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { DASHBOARD_ELEMENT, WIDGET_ELEMENT } from './widget/WidgetUtils';
import PortalPanel from './layout/PortalPanel';
import UIWidget from './UIWidget';
import styles from './styles.scss?inline';

// We need to inject the styles into the document when we're loaded... we only want to do this once.
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

export const UIWidgetPlugin: WidgetPlugin<dh.Widget> = {
  name: '@deephaven/js-plugin-ui',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: [WIDGET_ELEMENT, DASHBOARD_ELEMENT, PortalPanel.displayName],
  component: UIWidget,
  icon: vsGraph,
};

export default UIWidgetPlugin;
