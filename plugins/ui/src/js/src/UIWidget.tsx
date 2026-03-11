import type { dh } from '@deephaven/jsapi-types';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { WidgetDescriptor } from '@deephaven/dashboard';
import UIComponent from './UIComponent';
import PortalPanel from './layout/PortalPanel';

type UIWidgetProps = WidgetComponentProps<dh.Widget> & {
  // TODO: We shouldn't need this, should be added to the WidgetComponentProps type
  metadata?: WidgetDescriptor;
};

export function UIWidget(props: UIWidgetProps): JSX.Element | null {
  const { metadata: widgetDescriptor } = props;
  if (widgetDescriptor?.type === PortalPanel.displayName) {
    return null;
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <UIComponent {...props} />;
}

export default UIWidget;
