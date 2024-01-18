import React, { useCallback, useEffect, useMemo, useState } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutManagerContext,
  PanelEvent,
  useListener,
  useDashboardData,
  emitCreateDashboard,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { useConnection } from '@deephaven/jsapi-components';
import { Widget } from '@deephaven/jsapi-types';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import styles from './styles.scss?inline';
import { WidgetWrapper } from './WidgetTypes';
import PortalPanel from './PortalPanel';
import WidgetHandler from './WidgetHandler';

const NAME_ELEMENT = 'deephaven.ui.Element';
const DASHBOARD_ELEMENT = 'deephaven.ui.Dashboard';

const log = Log.module('@deephaven/js-plugin-ui.DashboardPlugin');

export function DashboardPlugin({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element | null {
  const connection = useConnection();
  const dashboardData = useDashboardData(id);

  // Keep track of the widgets we've got opened.
  const [widgetMap, setWidgetMap] = useState<
    ReadonlyMap<string, WidgetWrapper>
  >(new Map());
  const handlePanelOpen = useCallback(
    ({
      fetch,
      panelId: widgetId = shortid.generate(),
      widget,
    }: {
      fetch: () => Promise<Widget>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { type } = widget;
      if (type !== NAME_ELEMENT) {
        // Only want to listen for Element panels trying to be opened
        return;
      }
      log.info('Opening widget with ID', widgetId);
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
        newWidgetMap.set(widgetId, { definition, fetch, id: widgetId });
        return newWidgetMap;
      });
    },
    []
  );

  const handleDashboardOpen = useCallback(
    ({ widget }: { widget: VariableDefinition }) => {
      const { type } = widget;
      if (type !== DASHBOARD_ELEMENT) {
        return;
      }

      log.debug('Emitting create dashboard event for', widget);
      emitCreateDashboard(layout.eventHub, {
        pluginId: DASHBOARD_ELEMENT,
        title: widget.title,
        data: {
          type: widget.type,
          title: widget.title,
          id: widget.id,
        },
      });
    },
    [layout.eventHub]
  );

  useEffect(
    function loadDashboard() {
      const pluginData = dashboardData.pluginData?.[DASHBOARD_ELEMENT];

      log.info('Loading dashboard', pluginData);

      if (pluginData == null) {
        return;
      }

      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map<string, WidgetWrapper>(prevWidgetMap);
        // We need to create a new definition object, otherwise the layout will think it's already open
        // Can't use a spread operator because the widget definition uses property accessors

        newWidgetMap.set(id, {
          definition: pluginData,
          fetch: () =>
            connection.getObject(pluginData) as unknown as Promise<Widget>,
          id,
        });
        return newWidgetMap;
      });
    },
    [connection, dashboardData.pluginData, id]
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
  useListener(layout.eventHub, PanelEvent.OPEN, handleDashboardOpen);
  useListener(layout.eventHub, PanelEvent.CLOSE, handlePanelClose);

  const widgetHandlers = useMemo(
    () =>
      [...widgetMap.entries()].map(([widgetId, widget]) => (
        <WidgetHandler
          key={widgetId}
          widget={widget}
          onClose={handleWidgetClose}
        />
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
