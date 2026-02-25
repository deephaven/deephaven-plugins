import React, { PropsWithChildren, useState } from 'react';
import { Dashboard as DHCDashboard } from '@deephaven/dashboard';
import { useDashboardPlugins } from '@deephaven/plugin';
import NestedDashboardContent from './NestedDashboardContent';
import { ElementIdProps } from './LayoutUtils';

type NestedDashboardProps = PropsWithChildren<ElementIdProps>;

/**
 * A dashboard that can be nested inside a panel.
 * Creates its own GoldenLayout instance and manages panels independently.
 */
function NestedDashboard({
  children,
  __dhId,
}: NestedDashboardProps): JSX.Element {
  const plugins = useDashboardPlugins();
  const [layoutInitialized, setLayoutInitialized] = useState(false);

  return (
    <div
      className="dh-nested-dashboard"
      style={{ width: '100%', height: '100%' }}
    >
      {/* DHCDashboard creates GoldenLayout and provides LayoutManagerContext */}
      <DHCDashboard onLayoutInitialized={() => setLayoutInitialized(true)}>
        {plugins}
        {layoutInitialized && (
          <NestedDashboardContent __dhId={__dhId}>
            {children}
          </NestedDashboardContent>
        )}
      </DHCDashboard>
    </div>
  );
}

NestedDashboard.displayName = 'NestedDashboard';

export default NestedDashboard;
