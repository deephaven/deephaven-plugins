import React, { Children } from 'react';
import type { DashboardElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import Column from './Column';

function Dashboard({ children }: DashboardElementProps): JSX.Element | null {
  const parent = useParentItem();

  const needsWrapper = Children.count(children) > 1;

  return (
    <ParentItemContext.Provider value={parent}>
      {needsWrapper ? <Column>{children}</Column> : children}
    </ParentItemContext.Provider>
  );
}

export default Dashboard;
