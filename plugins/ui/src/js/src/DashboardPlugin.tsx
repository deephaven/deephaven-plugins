import React, { useCallback, useEffect, useMemo, useState } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutManagerContext,
  PanelEvent,
  useListener,
  useDashboardPluginData,
  emitCreateDashboard,
  WidgetDescriptor,
  PanelOpenEventDetail,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import {
  DeferredApiBootstrap,
  useObjectFetcher,
} from '@deephaven/jsapi-bootstrap';
import { Widget } from '@deephaven/jsapi-types';
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
  widget: WidgetDescriptor;
}

export function DashboardPlugin({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element | null {
  const [pluginData] = useDashboardPluginData(
    id,
    DASHBOARD_ELEMENT
  ) as unknown as [DashboardPluginData];

  const objectFetcher = useObjectFetcher();

  // Keep track of the widgets we've got opened.
  const [widgetMap, setWidgetMap] = useState<
    ReadonlyMap<string, WidgetWrapper>
  >(new Map());

  const handleWidgetOpen = useCallback(
    ({
      fetch,
      widgetId = shortid.generate(),
      widget,
    }: {
      fetch: () => Promise<Widget>;
      widgetId: string;
      widget: WidgetDescriptor;
    }) => {
      log.info('Opening widget with ID', widgetId, widget);
      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map<string, WidgetWrapper>(prevWidgetMap);
        newWidgetMap.set(widgetId, {
          fetch,
          id: widgetId,
          widget,
        });
        return newWidgetMap;
      });
    },
    []
  );

  const handleDashboardOpen = useCallback(
    ({ widget }: { widget: WidgetDescriptor }) => {
      const { id: dashboardId, type, name: title = 'Untitled' } = widget;
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
          widget,
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
    }: PanelOpenEventDetail<Widget>) => {
      const { type } = widget;

      switch (type) {
        case NAME_ELEMENT: {
          const widgetFetch = fetch ?? (() => objectFetcher(widget));
          handleWidgetOpen({ fetch: widgetFetch, widgetId, widget });
          break;
        }
        case DASHBOARD_ELEMENT: {
          handleDashboardOpen({ widget });
          break;
        }
        default: {
          log.error('Unknown widget type', type);
        }
      }
    },
    [handleDashboardOpen, handleWidgetOpen, objectFetcher]
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

        const { widget } = pluginData;
        newWidgetMap.set(id, {
          fetch: () => objectFetcher(widget),
          id,
          widget,
        });
        return newWidgetMap;
      });
    },
    [objectFetcher, pluginData, id]
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
          <DeferredApiBootstrap widget={widget.widget}>
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
