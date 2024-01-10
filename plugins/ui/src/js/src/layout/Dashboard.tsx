import React, { useEffect, useState } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { StackElementProps } from './LayoutUtils';
import { ParentItemContext } from './ParentItemContext';

function Dashboard({ children }: StackElementProps): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const [dashboard, setDashboard] = useState(true);

  useEffect(() => {
    layoutManager.root.callDownwards('_$destroy', [], true, true);
    layoutManager.root.contentItems = [];
    setDashboard(true);
  }, []);

  if (!dashboard) {
    return null;
  }

  return (
    <ParentItemContext.Provider value={layoutManager.root}>
      {children}
    </ParentItemContext.Provider>
  );
}

type test = (string | string[])[];

export default Dashboard;
