import {
  DashboardPluginComponentProps,
  useDashboardPanel,
} from '@deephaven/dashboard';
import ComponentPanel from './ComponentPanel';

const NAME_COMPONENT_NODE = 'deephaven.ui.node.ComponentNode';

export function DashboardPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  useDashboardPanel({
    dashboardProps: props,
    component: ComponentPanel,
    componentName: ComponentPanel.displayName,
    supportedTypes: [NAME_COMPONENT_NODE],
  });

  return null;
}

export default DashboardPlugin;
