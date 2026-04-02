import React, { PropsWithChildren, useMemo, useState } from 'react';
import { Dashboard as DHCDashboard } from '@deephaven/dashboard';
import { useDashboardPlugins } from '@deephaven/plugin';
import NestedDashboardContent from './NestedDashboardContent';
import { ElementIdProps } from './LayoutUtils';

type NestedDashboardProps = PropsWithChildren<ElementIdProps> & {
  /**
   * Whether to show the headers on panels in this dashboard. Defaults to `true`
   */
  showHeaders?: boolean;
};

/**
 * A dashboard that can be nested inside a panel.
 * Creates its own GoldenLayout instance and manages panels independently.
 */
function NestedDashboard({
  children,
  showHeaders = true,
  __dhId,
}: NestedDashboardProps): JSX.Element {
  const plugins = useDashboardPlugins();
  const [layoutInitialized, setLayoutInitialized] = useState(false);
  const layoutSettings = useMemo(
    () => ({ hasHeaders: showHeaders }),
    [showHeaders]
  );

  return (
    <div className="dh-nested-dashboard">
      {/* DHCDashboard creates GoldenLayout and provides LayoutManagerContext */}
      <DHCDashboard
        onLayoutInitialized={() => setLayoutInitialized(true)}
        layoutSettings={layoutSettings}
      >
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
