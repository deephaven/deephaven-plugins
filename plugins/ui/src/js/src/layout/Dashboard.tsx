import React from 'react';
import type { StackElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';

function Dashboard({ children }: StackElementProps): JSX.Element | null {
  const parent = useParentItem();

  return (
    <ParentItemContext.Provider value={parent}>
      {children}
    </ParentItemContext.Provider>
  );
}

export default Dashboard;
