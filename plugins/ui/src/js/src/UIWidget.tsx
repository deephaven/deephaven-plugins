import type { dh } from '@deephaven/jsapi-types';
import { type WidgetComponentProps } from '@deephaven/plugin';
import UIComponent from './UIComponent';
import PortalPanel from './layout/PortalPanel';

type UIWidgetProps = WidgetComponentProps<dh.Widget>;

/**
 * A component for rendering a UI widget. Registered by the WidgetPlugin to load deephaven.ui widgets.
 * Chooses to ignore PortalPanel widgets, which were used by the legacy DashboardPlugin to render elements, since they are not needed with the new plugin architecture.
 * @param props Props for the widget component.
 * @returns A JSX element representing the UI widget, or null if the widget should be ignored.
 */
export function UIWidget(props: UIWidgetProps): JSX.Element | null {
  const { metadata: widgetDescriptor } = props;
  if (widgetDescriptor?.type === PortalPanel.displayName) {
    // PortalPanel was used by the legacy DashboardPlugin to render elements. We just ignore them here.
    return null;
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <UIComponent {...props} />;
}

export default UIWidget;
