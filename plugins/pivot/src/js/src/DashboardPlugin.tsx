import React from 'react';
import {
  type DashboardPluginComponentProps,
  useDashboardPanel,
} from '@deephaven/dashboard';
import { assertNotNull } from '@deephaven/utils';
import PivotPanel from './PivotPanel';

const VARIABLE_TYPE = 'PivotTable';

export function DashboardPlugin(
  dashboardProps: DashboardPluginComponentProps
): React.ReactNode {
  assertNotNull(PivotPanel.displayName);

  useDashboardPanel({
    dashboardProps,
    componentName: PivotPanel.displayName,
    supportedTypes: VARIABLE_TYPE,
    component: PivotPanel,
  });

  return null;
}

export default DashboardPlugin;
