import React from 'react';
import {
  DashboardPluginComponentProps,
  useDashboardPanel,
} from '@deephaven/dashboard';
import ElementPanel from './ElementPanel';
import styles from './styles.scss?inline';

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

  return <style>{styles}</style>;
}

export default DashboardPlugin;
