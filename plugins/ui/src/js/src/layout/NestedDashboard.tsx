import React, {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type DashboardLayoutConfig,
  Dashboard as DHCDashboard,
  usePersistentState,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { useDashboardPlugins } from '@deephaven/plugin';
import { useThrottledCallback } from '@deephaven/react-hooks';
import { type ElementIdProps } from './LayoutUtils';
import { InitialLayoutConfigContext } from './InitialLayoutConfigContext';
import PortalPanelManager from './PortalPanelManager';
import { usePanelManager } from './usePanelManager';
import type { WidgetData } from '../widget/WidgetTypes';
import { useWidgetStatus } from './useWidgetStatus';
import DashboardContent from './DashboardContent';
import { ReactPanelContext } from './ReactPanelContext';
import { ReactPanelManagerContext } from './ReactPanelManager';

const log = Log.module('@deephaven/js-plugin-ui/NestedDashboard');

const DATA_CHANGE_THROTTLE_MS = 1000;

type NestedDashboardProps = PropsWithChildren<ElementIdProps> & {
  /**
   * Whether to show the headers on panels in this dashboard. Defaults to `true`
   */
  showHeaders?: boolean;
};

type DashboardData = {
  layoutConfig?: DashboardLayoutConfig;
  widgetData?: WidgetData;
};

/**
 * A dashboard that can be nested inside a panel.
 * Creates its own GoldenLayout instance and manages panels independently.
 * Also persists the state of the dashboard (layout and widget data).
 */
function NestedDashboard({
  children,
  showHeaders = true,
}: NestedDashboardProps): JSX.Element {
  const { descriptor: widget } = useWidgetStatus();
  const plugins = useDashboardPlugins();
  const [dashboardData, setDashboardData] = usePersistentState<
    DashboardData | undefined
  >(undefined, { type: 'NestedDashboardData', version: 1 });
  const [layoutInitialized, setLayoutInitialized] = useState(false);
  const layoutSettings = useMemo(
    () => ({ hasHeaders: showHeaders }),
    [showHeaders]
  );
  const { layoutConfig, widgetData } = dashboardData ?? {};

  // We want to know if the initial layoutConfig is set so we know if the dashboard has previously been loaded.
  // User may have moved panels around, and we don't want the layout rows/columns to be blown away their changes
  const [initialLayoutConfig] = useState(() => layoutConfig);
  const [initialWidgetData] = useState(() => widgetData);

  // Track the latest committed widgetData and any pending merged updates so
  // we can throttle calls to setDashboardData and skip no-op updates that
  // would otherwise re-render in a loop.
  const lastWidgetDataRef = useRef<WidgetData | undefined>(initialWidgetData);
  const pendingWidgetDataRef = useRef<WidgetData | undefined>(undefined);

  const flushDataChange = useThrottledCallback(
    () => {
      const pending = pendingWidgetDataRef.current;
      if (pending == null) {
        return;
      }
      pendingWidgetDataRef.current = undefined;

      const last = lastWidgetDataRef.current;
      // Deep-equality check to avoid triggering a state update (and the
      // re-render loop) when the merged widgetData hasn't actually changed.
      if (last != null && JSON.stringify(last) === JSON.stringify(pending)) {
        return;
      }
      lastWidgetDataRef.current = pending;
      setDashboardData(
        oldData =>
          ({
            ...oldData,
            widgetData: pending,
          }) as DashboardData
      );
    },
    DATA_CHANGE_THROTTLE_MS,
    { flushOnUnmount: true }
  );

  useEffect(() => () => flushDataChange.flush(), [flushDataChange]);

  const handleDataChange = useCallback(
    (data: WidgetData) => {
      // Accumulate partial updates between throttled flushes so we don't
      // lose intermediate widget data changes.
      const base = pendingWidgetDataRef.current ?? lastWidgetDataRef.current;
      pendingWidgetDataRef.current = { ...base, ...data };
      flushDataChange();
    },
    [flushDataChange]
  );

  const panelManager = usePanelManager({
    widget,
    onDataChange: handleDataChange,
    initialData: initialWidgetData,
  });

  return (
    <div className="dh-nested-dashboard">
      {/* DHCDashboard creates GoldenLayout and provides LayoutManagerContext */}
      <DHCDashboard
        onLayoutInitialized={() => setLayoutInitialized(true)}
        onLayoutConfigChange={config => {
          log.debug('NestedDashboard Layout config changed:', config);
          setDashboardData(oldData => ({ ...oldData, layoutConfig: config }));
        }}
        layoutSettings={layoutSettings}
        layoutConfig={layoutConfig}
      >
        {plugins}

        <PortalPanelManager>
          {layoutInitialized && (
            <InitialLayoutConfigContext.Provider value={initialLayoutConfig}>
              <ReactPanelManagerContext.Provider value={panelManager}>
                {/* Reset ReactPanelContext so nested panels don't throw NestedPanelError */}
                <ReactPanelContext.Provider value={null}>
                  <DashboardContent>{children}</DashboardContent>
                </ReactPanelContext.Provider>
              </ReactPanelManagerContext.Provider>
            </InitialLayoutConfigContext.Provider>
          )}
        </PortalPanelManager>
      </DHCDashboard>
    </div>
  );
}

NestedDashboard.displayName = 'NestedDashboard';

export default NestedDashboard;
