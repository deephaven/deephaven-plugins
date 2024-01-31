import React, { useCallback, useEffect, useMemo, useState } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutManagerContext,
  PanelEvent,
  useListener,
  useDashboardPluginData,
  emitCreateDashboard,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { useConnection } from '@deephaven/jsapi-components';
import { DeferredApiBootstrap } from '@deephaven/jsapi-bootstrap';
import { Widget } from '@deephaven/jsapi-types';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import { ErrorBoundary } from '@deephaven/components';
import styles from './styles.scss?inline';
import { WidgetWrapper } from './WidgetTypes';
import PortalPanel from './PortalPanel';
import WidgetHandler from './WidgetHandler';

const NAME_ELEMENT = 'deephaven.ui.Element';
const DASHBOARD_ELEMENT = 'deephaven.ui.Dashboard';

const log = Log.module('@deephaven/js-plugin-ui.DashboardPlugin');

/**
 * The data stored in redux when the user creates a ui.dashboard.
 */
interface DashboardPluginData {
  type: string;
  title: string;
  id: string;
  metadata: Record<string, unknown>;
}

export function DashboardPlugin({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element | null {
  const connection = useConnection();
  const [pluginData] = useDashboardPluginData(
    id,
    DASHBOARD_ELEMENT
  ) as unknown as [DashboardPluginData];

  // Keep track of the widgets we've got opened.
  const [widgetMap, setWidgetMap] = useState<
    ReadonlyMap<string, WidgetWrapper>
  >(new Map());

  const handleWidgetOpen = useCallback(
    ({
      fetch,
      metadata,
      panelId: widgetId = shortid.generate(),
      widget,
    }: {
      fetch: () => Promise<Widget>;
      metadata: Record<string, unknown>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      log.info('Opening widget with ID', widgetId, metadata);
      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map<string, WidgetWrapper>(prevWidgetMap);
        // We need to create a new definition object, otherwise the layout will think it's already open
        // Can't use a spread operator because the widget definition uses property accessors
        const definition = {
          type: widget.type,
          title: widget.title,
          id: widget.id,
          name: widget.name,
        };
        newWidgetMap.set(widgetId, {
          definition,
          fetch,
          id: widgetId,
          metadata,
        });
        return newWidgetMap;
      });
    },
    []
  );

  const handleDashboardOpen = useCallback(
    ({
      widget,
      metadata,
    }: {
      widget: VariableDefinition;
      metadata: Record<string, unknown>;
    }) => {
      const { id: dashboardId, type, title = 'Untitled' } = widget;
      if (dashboardId == null) {
        log.error("Can't open dashboard without an ID", widget);
        return;
      }
      log.debug('Emitting create dashboard event for', widget);
      emitCreateDashboard(layout.eventHub, {
        pluginId: DASHBOARD_ELEMENT,
        title,
        data: {
          type,
          title,
          id: dashboardId,
          metadata,
        } satisfies DashboardPluginData,
      });
    },
    [layout.eventHub]
  );

  const handlePanelOpen = useCallback(
    ({
      fetch,
      panelId: widgetId = shortid.generate(),
      widget,
      metadata = {},
    }: {
      fetch: () => Promise<Widget>;
      panelId?: string;
      widget: VariableDefinition;
      metadata: Record<string, unknown>;
    }) => {
      const { type } = widget;

      switch (type) {
        case NAME_ELEMENT: {
          handleWidgetOpen({ fetch, panelId: widgetId, widget, metadata });
          break;
        }
        case DASHBOARD_ELEMENT: {
          handleDashboardOpen({ widget, metadata });
          break;
        }
        default: {
          log.error('Unknown widget type', type);
        }
      }
    },
    [handleDashboardOpen, handleWidgetOpen]
  );

  useEffect(
    function loadDashboard() {
      if (pluginData == null) {
        return;
      }

      log.info('Loading dashboard', pluginData);

      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map<string, WidgetWrapper>(prevWidgetMap);
        // We need to create a new definition object, otherwise the layout will think it's already open
        // Can't use a spread operator because the widget definition uses property accessors

        newWidgetMap.set(id, {
          definition: pluginData,
          fetch: () =>
            connection.getObject(pluginData) as unknown as Promise<Widget>,
          id,
          metadata: {},
        });
        return newWidgetMap;
      });
    },
    [connection, pluginData, id]
  );

  const handlePanelClose = useCallback((panelId: string) => {
    setWidgetMap(prevWidgetMap => {
      if (!prevWidgetMap.has(panelId)) {
        return prevWidgetMap;
      }
      const newWidgetMap = new Map<string, WidgetWrapper>(prevWidgetMap);
      newWidgetMap.delete(panelId);
      return newWidgetMap;
    });
  }, []);

  const handleWidgetClose = useCallback((widgetId: string) => {
    log.debug('Closing widget', widgetId);
    setWidgetMap(prevWidgetMap => {
      const newWidgetMap = new Map<string, WidgetWrapper>(prevWidgetMap);
      newWidgetMap.delete(widgetId);
      return newWidgetMap;
    });
  }, []);

  useEffect(() => {
    const cleanups = [registerComponent(PortalPanel.displayName, PortalPanel)];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  // TODO: We need to change up the event system for how objects are opened, since in this case it could be opening multiple panels
  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);
  useListener(layout.eventHub, PanelEvent.CLOSE, handlePanelClose);

  const widgetHandlers = useMemo(
    () =>
      [...widgetMap.entries()].map(([widgetId, widget]) => (
        <ErrorBoundary key={widgetId}>
          <DeferredApiBootstrap options={widget.metadata}>
            <WidgetHandler widget={widget} onClose={handleWidgetClose} />
          </DeferredApiBootstrap>
        </ErrorBoundary>
      )),
    [handleWidgetClose, widgetMap]
  );

  return (
    // We'll need to change up how the layout is provided once we have widgets that can open other dashboards...
    <LayoutManagerContext.Provider value={layout}>
      <style>{styles}</style>
      {widgetHandlers}
    </LayoutManagerContext.Provider>
  );
}

export default DashboardPlugin;
