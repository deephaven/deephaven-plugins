import React from 'react';
import {
  normalizeDashboardChildren,
  type DashboardElementProps,
} from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';

function Dashboard({ children }: DashboardElementProps): JSX.Element | null {
  const parent = useParentItem();

  const normalizedChildren = normalizeDashboardChildren(children);

  return (
    <ParentItemContext.Provider value={parent}>
      {normalizedChildren}
    </ParentItemContext.Provider>
  );
}

export default Dashboard;
