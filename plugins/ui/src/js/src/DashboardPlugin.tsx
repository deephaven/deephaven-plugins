import React, { useCallback, useEffect, useMemo, useState } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutManagerContext,
  LayoutUtils,
  PanelEvent,
  useListener,
  useDashboardPluginData,
  emitCreateDashboard,
  WidgetDescriptor,
  PanelOpenEventDetail,
  DEFAULT_DASHBOARD_ID,
  useDashboardPanel,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import {
  DeferredApiBootstrap,
  useObjectFetcher,
} from '@deephaven/jsapi-bootstrap';
import { Widget } from '@deephaven/jsapi-types';
import { ErrorBoundary } from '@deephaven/components';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import styles from './styles.scss?inline';
import { WidgetData, WidgetId, WidgetWrapper } from './widget/WidgetTypes';
import PortalPanel from './layout/PortalPanel';
import WidgetHandler from './widget/WidgetHandler';
import PortalPanelManager from './layout/PortalPanelManager';

const NAME_ELEMENT = 'deephaven.ui.Element';
const DASHBOARD_ELEMENT = 'deephaven.ui.Dashboard';
const PLUGIN_NAME = '@deephaven/js-plugin-ui.DashboardPlugin';

const log = Log.module('@deephaven/js-plugin-ui.DashboardPlugin');

/**
 * The data stored in redux when the user creates a ui.dashboard.
 */
interface DashboardPluginData {
  /** Map of open widgets */
  openWidgets: Record<
    WidgetId,
    {
      descriptor: WidgetDescriptor;
      data?: WidgetData;
    }
  >;
}

export function DashboardPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  const { id, layout } = props;
  const [pluginData, setPluginData] = useDashboardPluginData(
    id,
    PLUGIN_NAME
  ) as unknown as [DashboardPluginData, (data: DashboardPluginData) => void];
  const [initialPluginData] = useState(pluginData);

  const objectFetcher = useObjectFetcher();

  // Keep track of the widgets we've got opened.
  const [widgetMap, setWidgetMap] = useState<
    ReadonlyMap<WidgetId, WidgetWrapper>
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
        const newWidgetMap = new Map<WidgetId, WidgetWrapper>(prevWidgetMap);
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
    ({
      widget,
      dashboardId,
    }: {
      widget: WidgetDescriptor;
      dashboardId: string;
    }) => {
      const { name: title = 'Untitled' } = widget;
      log.debug('Emitting create dashboard event for', dashboardId, widget);
      emitCreateDashboard(layout.eventHub, {
        pluginId: PLUGIN_NAME,
        title,
        data: { openWidgets: { [dashboardId]: { descriptor: widget } } },
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
          handleDashboardOpen({ widget, dashboardId: widgetId });
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
    function loadInitialPluginData() {
      if (initialPluginData == null) {
        log.info('loadInitialPluginData no data');
        return;
      }

      log.info('loadInitialPluginData', initialPluginData);

      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map<WidgetId, WidgetWrapper>(prevWidgetMap);
        const { openWidgets } = initialPluginData;
        const widgetIds = Object.keys(openWidgets);
        for (let i = 0; i < widgetIds.length; i += 1) {
          const widgetId = widgetIds[i];
          const { descriptor, data } = openWidgets[widgetId];
          newWidgetMap.set(widgetId, {
            fetch: () => objectFetcher(descriptor),
            id: widgetId,
            widget: descriptor,
            data,
          });
        }
        return newWidgetMap;
      });
    },
    [objectFetcher, initialPluginData, id]
  );

  const handlePanelClose = useCallback(
    (panelId: string) => {
      log.debug2('handlePanelClose', panelId);
      setWidgetMap(prevWidgetMap => {
        if (!prevWidgetMap.has(panelId)) {
          return prevWidgetMap;
        }
        const newWidgetMap = new Map<WidgetId, WidgetWrapper>(prevWidgetMap);
        newWidgetMap.delete(panelId);
        return newWidgetMap;
      });
      // We may need to clean up some panels for this widget if it hasn't actually loaded yet
      // We should be able to always be able to do this even if it does load, so just remove any panels from the initial load
      const { openWidgets } = initialPluginData;
      const openWidget = openWidgets[panelId];
      if (openWidget?.data?.panelIds != null) {
        const { panelIds } = openWidget.data;
        for (let i = 0; i < panelIds.length; i += 1) {
          LayoutUtils.closeComponent(layout.root, { id: panelIds[i] });
        }
      }
    },
    [initialPluginData, layout]
  );

  const handleWidgetClose = useCallback((widgetId: string) => {
    log.debug('handleWidgetClose', widgetId);
    setWidgetMap(prevWidgetMap => {
      const newWidgetMap = new Map<WidgetId, WidgetWrapper>(prevWidgetMap);
      newWidgetMap.delete(widgetId);
      return newWidgetMap;
    });
  }, []);

  useDashboardPanel({
    dashboardProps: props,
    componentName: PortalPanel.displayName,
    component: PortalPanel,

    // We don't want these panels to be triggered by a widget opening, we want to control how it is opened later
    supportedTypes: [],
  });

  // TODO: We need to change up the event system for how objects are opened, since in this case it could be opening multiple panels
  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);
  useListener(layout.eventHub, PanelEvent.CLOSE, handlePanelClose);

  const sendPluginDataUpdate = useCallback(
    (newPluginData: DashboardPluginData) => {
      log.debug('sendPluginDataUpdate', newPluginData);
      setPluginData(newPluginData);
    },
    [setPluginData]
  );

  const debouncedSendPluginDataUpdate = useDebouncedCallback(
    sendPluginDataUpdate,
    500
  );

  useEffect(
    function updatePluginData() {
      // Updates the plugin data with the widgets that are now open in this dashboard
      const openWidgets: DashboardPluginData['openWidgets'] = {};
      widgetMap.forEach((widgetWrapper, widgetId) => {
        openWidgets[widgetId] = {
          descriptor: widgetWrapper.widget,
          data: widgetWrapper.data,
        };
      });
      const newPluginData = { openWidgets };
      debouncedSendPluginDataUpdate(newPluginData);
    },
    [widgetMap, debouncedSendPluginDataUpdate]
  );

  const handleWidgetDataChange = useCallback(
    (widgetId: string, data: WidgetData) => {
      log.debug('handleWidgetDataChange', widgetId, data);
      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map<WidgetId, WidgetWrapper>(prevWidgetMap);
        const widget = newWidgetMap.get(widgetId);
        if (widget == null) {
          throw new Error(`Widget not found: ${widgetId}`);
        }
        // We don't want the data change to re-render the WidgetHandler, so we mutate the object directly
        // Will still re-render the DashboardPlugin though, which will save the data
        widget.data = data;
        return newWidgetMap;
      });
    },
    []
  );

  const widgetHandlers = useMemo(
    () =>
      [...widgetMap.entries()].map(([widgetId, widget]) => (
        // Fallback to an empty array in default dashboard so we don't display errors over code studio
        <ErrorBoundary
          key={widgetId}
          fallback={id === DEFAULT_DASHBOARD_ID ? [] : null}
        >
          <DeferredApiBootstrap widget={widget.widget}>
            <WidgetHandler
              widget={widget}
              onDataChange={handleWidgetDataChange}
              onClose={handleWidgetClose}
            />
          </DeferredApiBootstrap>
        </ErrorBoundary>
      )),
    [handleWidgetClose, handleWidgetDataChange, widgetMap, id]
  );

  return (
    <LayoutManagerContext.Provider value={layout}>
      <style>{styles}</style>
      <PortalPanelManager>{widgetHandlers}</PortalPanelManager>
    </LayoutManagerContext.Provider>
  );
}

export default DashboardPlugin;
