import {
  DashboardPluginComponentProps,
  useDashboardPanel,
} from '@deephaven/dashboard';
import ElementPanel from './ElementPanel';

const NAME_ELEMENT = 'deephaven.ui.elements.Element.Element';

export function DashboardPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  useDashboardPanel({
    dashboardProps: props,
    component: ElementPanel,
    componentName: ElementPanel.displayName,
    supportedTypes: [NAME_ELEMENT],
  });

  return null;
}

export default DashboardPlugin;
