import {
  DashboardPluginComponentProps,
  useDashboardPanel,
} from '@deephaven/dashboard';
import ComponentPanel from './ComponentPanel';

const NAME_UI_NODE = 'deephaven.ui.components.node.UINode';

export function DashboardPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  useDashboardPanel({
    dashboardProps: props,
    component: ComponentPanel,
    componentName: ComponentPanel.displayName,
    supportedTypes: [NAME_UI_NODE],
  });

  return null;
}

export default DashboardPlugin;
