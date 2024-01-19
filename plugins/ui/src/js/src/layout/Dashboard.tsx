import React from 'react';
import type { DashboardElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';

function Dashboard({ children }: DashboardElementProps): JSX.Element | null {
  const parent = useParentItem();

  return (
    <ParentItemContext.Provider value={parent}>
      {children}
    </ParentItemContext.Provider>
  );
}

export default Dashboard;
