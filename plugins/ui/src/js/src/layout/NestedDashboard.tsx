import React, { type PropsWithChildren, useMemo, useState } from 'react';
import {
  DashboardLayoutConfig,
  Dashboard as DHCDashboard,
  usePersistentState,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { useDashboardPlugins } from '@deephaven/plugin';
import NestedDashboardContent from './NestedDashboardContent';
import { type ElementIdProps } from './LayoutUtils';
import { InitialLayoutConfigContext } from './InitialLayoutConfigContext';
import PortalPanelManager from './PortalPanelManager';

const log = Log.module('@deephaven/js-plugin-ui/NestedDashboard');

type NestedDashboardProps = PropsWithChildren<ElementIdProps> & {
  /**
   * Whether to show the headers on panels in this dashboard. Defaults to `true`
   */
  showHeaders?: boolean;
};

type DashboardData = {
  layoutConfig?: DashboardLayoutConfig;
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
  const [dashboardData, setDashboardData] = usePersistentState<
    DashboardData | undefined
  >(undefined, { type: 'NestedDashboardData', version: 1 });
  const [layoutInitialized, setLayoutInitialized] = useState(false);
  const layoutSettings = useMemo(
    () => ({ hasHeaders: showHeaders }),
    [showHeaders]
  );
  const { layoutConfig } = dashboardData ?? {};

  // We want to know if the initial layoutConfig is set so we know if the dashboard has previously been loaded.
  // User may have moved panels around, and we don't want the layout rows/columns to be blow away their changes
  const [initialLayoutConfig] = useState(() => layoutConfig);
  console.log(
    'xxx NestedDashboard initialLayoutConfig',
    initialLayoutConfig,
    'layoutConfig',
    layoutConfig
  );

  return (
    <div className="dh-nested-dashboard">
      {/* DHCDashboard creates GoldenLayout and provides LayoutManagerContext */}
      <DHCDashboard
        onLayoutInitialized={() => setLayoutInitialized(true)}
        onLayoutConfigChange={config => {
          log.debug('NestedDashboard Layout config changed:', config);
          setDashboardData({ layoutConfig: config });
        }}
        layoutSettings={layoutSettings}
        layoutConfig={layoutConfig}
      >
        {plugins}

        <PortalPanelManager>
          {layoutInitialized && (
            <InitialLayoutConfigContext.Provider value={initialLayoutConfig}>
              <NestedDashboardContent __dhId={__dhId}>
                {children}
              </NestedDashboardContent>
            </InitialLayoutConfigContext.Provider>
          )}
        </PortalPanelManager>
      </DHCDashboard>
    </div>
  );
}

NestedDashboard.displayName = 'NestedDashboard';

export default NestedDashboard;
