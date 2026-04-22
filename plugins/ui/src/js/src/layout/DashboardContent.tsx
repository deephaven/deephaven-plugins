import React from 'react';
import { normalizeDashboardChildren } from './LayoutUtils';
import { ParentItemContext } from './ParentItemContext';

interface DashboardContentProps {
  children: React.ReactNode;
}

/**
 * Content rendered for a top-level dashboard.
 * Uses the existing layout manager's root.
 */
function DashboardContent({ children }: DashboardContentProps): JSX.Element {
  const normalizedChildren = normalizeDashboardChildren(children);

  return (
    // Reset the root so that any children fetching the parent item will default to the layoutManager's root.
    <ParentItemContext.Provider value={null}>
      {normalizedChildren}
    </ParentItemContext.Provider>
  );
}

export default DashboardContent;
