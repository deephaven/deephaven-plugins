import React from 'react';
import { DashboardPluginComponentProps } from '@deephaven/dashboard';

export const LayoutContext: React.Context<
  DashboardPluginComponentProps['layout'] | undefined
> = React.createContext<DashboardPluginComponentProps['layout'] | undefined>(
  undefined
);

export default LayoutContext;
