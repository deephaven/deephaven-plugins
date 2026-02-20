import React, { useRef, useState } from 'react';
import {
  DashboardLayoutConfig,
  Dashboard as DHCDashboard,
} from '@deephaven/dashboard';
import { useDashboardPlugins, usePersistentState } from '@deephaven/plugin';
import NestedDashboardContent from './NestedDashboardContent';

interface NestedDashboardProps {
  children: React.ReactNode;
}

/**
 * A dashboard that can be nested inside a panel.
 * Creates its own GoldenLayout instance and manages panels independently.
 */
function NestedDashboard({ children }: NestedDashboardProps): JSX.Element {
  const plugins = useDashboardPlugins();
  const [layoutInitialized, setLayoutInitialized] = useState(false);
  const [savedLayoutConfig, setSavedLayoutConfig] = usePersistentState<
    DashboardLayoutConfig | undefined
  >(undefined, { type: 'NestedDashboardLayout', version: 1 });

  const initialLayoutConfig = useRef(savedLayoutConfig);

  return (
    <div
      className="dh-nested-dashboard"
      style={{ width: '100%', height: '100%' }}
    >
      {/* DHCDashboard creates GoldenLayout and provides LayoutManagerContext */}
      <DHCDashboard
        onLayoutInitialized={() => setLayoutInitialized(true)}
        // TODO: There's an issue the web-client-ui package that has this typed incorrectly
        // https://github.com/deephaven/web-client-ui/pull/2622
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onLayoutConfigChange={setSavedLayoutConfig as any}
        layoutConfig={initialLayoutConfig.current}
      >
        {plugins}
        {layoutInitialized && (
          <NestedDashboardContent>{children}</NestedDashboardContent>
        )}
      </DHCDashboard>
    </div>
  );
}

NestedDashboard.displayName = 'NestedDashboard';

export default NestedDashboard;
