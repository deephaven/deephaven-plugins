import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
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
import { DeferredApiBootstrap } from '@deephaven/jsapi-bootstrap';
import { dh } from '@deephaven/jsapi-types';
import { ErrorBoundary } from '@deephaven/components';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import styles from './styles.scss?inline';
import {
  ReadonlyWidgetData,
  WidgetDataUpdate,
  WidgetId,
} from './widget/WidgetTypes';
import PortalPanel from './layout/PortalPanel';
import PortalPanelManager from './layout/PortalPanelManager';
import DashboardWidgetHandler from './widget/DashboardWidgetHandler';
import {
  getPreservedData,
  DASHBOARD_ELEMENT,
  WIDGET_ELEMENT,
} from './widget/WidgetUtils';
import { usePanelId } from './layout/ReactPanelContext';

const PLUGIN_NAME = '@deephaven/js-plugin-ui.DashboardPlugin';

const log = Log.module('@deephaven/js-plugin-ui.DashboardPlugin');

/**
 * The data stored in redux when the user creates a ui.dashboard.
 */
interface DashboardPluginData {
  /** Map of open widgets, along with any data that is stored with them. */
  openWidgets?: Record<
    WidgetId,
    {
      descriptor: WidgetDescriptor;
      data?: ReadonlyWidgetData;
    }
  >;
}

interface WidgetWrapper {
  /** ID of this widget */
  id: WidgetId;

  /** Descriptor for the widget. */
  widget: WidgetDescriptor;

  /** Data for the widget */
  data?: ReadonlyWidgetData;
}

function InnerDashboardPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  const { id, layout } = props;
  const [pluginData, setPluginData] = useDashboardPluginData(
    id,
    PLUGIN_NAME
  ) as unknown as [DashboardPluginData, (data: DashboardPluginData) => void];
  const [initialPluginData] = useState(pluginData);

  // Keep track of the widgets we've got opened.
  const [widgetMap, setWidgetMap] = useState<
    ReadonlyMap<WidgetId, WidgetWrapper>
  >(new Map());

  const handleWidgetOpen = useCallback(
    ({ widgetId, widget }: { widgetId: string; widget: WidgetDescriptor }) => {
      log.debug('Opening widget with ID', widgetId, widget);
      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map(prevWidgetMap);
        const oldWidget = newWidgetMap.get(widgetId);
        newWidgetMap.set(widgetId, {
          id: widgetId,
          widget,
          data: getPreservedData(oldWidget?.data),
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
      const { name: title } = widget;
      log.debug('Emitting create dashboard event for', dashboardId, widget);
      emitCreateDashboard(layout.eventHub, {
        pluginId: PLUGIN_NAME,
        title: title ?? 'Untitled',
        data: { openWidgets: { [dashboardId]: { descriptor: widget } } },
      });
    },
    [layout.eventHub]
  );

  const handlePanelOpen = useCallback(
    ({
      panelId: widgetId = nanoid(),
      widget,
    }: PanelOpenEventDetail<dh.Widget>) => {
      const { type } = widget;

      switch (type) {
        case WIDGET_ELEMENT: {
          handleWidgetOpen({ widgetId, widget });
          break;
        }
        case DASHBOARD_ELEMENT: {
          handleDashboardOpen({ widget, dashboardId: widgetId });
          break;
        }
        default: {
          break;
        }
      }
    },
    [handleDashboardOpen, handleWidgetOpen]
  );

  useEffect(
    function loadInitialPluginData() {
      if (initialPluginData == null) {
        log.debug('loadInitialPluginData no data');
        return;
      }

      log.debug('loadInitialPluginData', initialPluginData);

      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map(prevWidgetMap);
        const { openWidgets } = initialPluginData;
        if (openWidgets != null) {
          Object.entries(openWidgets).forEach(
            ([widgetId, { descriptor, data }]) => {
              newWidgetMap.set(widgetId, {
                id: widgetId,
                widget: descriptor,
                data,
              });
            }
          );
        }
        return newWidgetMap;
      });
    },
    [initialPluginData, id]
  );

  const handlePanelClose = useCallback(
    (panelId: string) => {
      log.debug2('handlePanelClose', panelId);
      setWidgetMap(prevWidgetMap => {
        if (!prevWidgetMap.has(panelId)) {
          return prevWidgetMap;
        }
        const newWidgetMap = new Map(prevWidgetMap);
        newWidgetMap.delete(panelId);
        return newWidgetMap;
      });
      // We may need to clean up some panels for this widget if it hasn't actually loaded yet
      // We should be able to always be able to do this even if it does load, so just remove any panels from the initial load
      if (initialPluginData != null) {
        const { openWidgets } = initialPluginData;
        const openWidget = openWidgets?.[panelId];
        if (openWidget?.data?.panelIds != null) {
          const { panelIds } = openWidget.data;
          for (let i = 0; i < panelIds.length; i += 1) {
            LayoutUtils.closeComponent(layout.root, { id: panelIds[i] });
          }
        }
      }
    },
    [initialPluginData, layout]
  );

  const handleWidgetClose = useCallback((widgetId: string) => {
    log.debug('handleWidgetClose', widgetId);
    setWidgetMap(prevWidgetMap => {
      const newWidgetMap = new Map(prevWidgetMap);
      newWidgetMap.delete(widgetId);
      return newWidgetMap;
    });
  }, []);

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
    (widgetId: string, data: WidgetDataUpdate) => {
      log.debug('handleWidgetDataChange', widgetId, data);
      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map(prevWidgetMap);
        const oldWidget = newWidgetMap.get(widgetId);
        if (oldWidget == null) {
          throw new Error(`Widget not found: ${widgetId}`);
        }
        newWidgetMap.set(widgetId, {
          ...oldWidget,
          data: {
            ...oldWidget.data,
            ...data,
          },
        });
        return newWidgetMap;
      });
    },
    []
  );

  const widgetHandlers = useMemo(
    () =>
      [...widgetMap.entries()].map(([widgetId, wrapper]) => (
        // Fallback to an empty array in default dashboard so we don't display errors over code studio
        <ErrorBoundary
          key={widgetId}
          fallback={id === DEFAULT_DASHBOARD_ID ? [] : null}
        >
          <DeferredApiBootstrap widget={wrapper.widget}>
            <DashboardWidgetHandler
              widgetDescriptor={wrapper.widget}
              id={wrapper.id}
              initialData={wrapper.data}
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

export function DashboardPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  useDashboardPanel({
    dashboardProps: props,
    componentName: PortalPanel.displayName,
    component: PortalPanel,

    // We don't want these panels to be triggered by a widget opening, we want to control how it is opened later
    supportedTypes: [],
  });

  const contextPanelId = usePanelId();
  const isNested = contextPanelId != null;
  if (isNested) {
    // We don't want the InnerDashboardPlugin to render in nested dashboards, as we don't want to fetch the dashboard data/handle panel opens in that scenario
    // It's all already handled by rendering the children.
    // We just need to register the PortalPanel component in that Dashboard.
    return null;
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <InnerDashboardPlugin {...props} />;
}

export default DashboardPlugin;
