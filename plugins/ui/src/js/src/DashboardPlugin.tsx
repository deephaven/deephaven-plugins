import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DashboardPluginComponentProps,
  LayoutManagerContext,
  LayoutUtils,
  PanelEvent,
  useListener,
  useDashboardPluginData,
  WidgetDescriptor,
  DEFAULT_DASHBOARD_ID,
  useDashboardPanel,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { DeferredApiBootstrap } from '@deephaven/jsapi-bootstrap';
import { ErrorBoundary } from '@deephaven/components';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import {
  ReadonlyWidgetData,
  WidgetDataUpdate,
  WidgetId,
} from './widget/WidgetTypes';
import PortalPanel from './layout/PortalPanel';
import PortalPanelManager from './layout/PortalPanelManager';
import DashboardWidgetHandler from './widget/DashboardWidgetHandler';
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

/**
 * Handle legacy behaviour of an open widget being saved with the dashboard.
 *
 * Now UIWidgetPlugin is responsible for opening widgets in the dashboard.
 * @param props Dashboard plugin props
 * @returns Dashboard plugin content, which is responsible for handling legacy behaviour of an open widget being saved with the dashboard
 */
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
      <PortalPanelManager>{widgetHandlers}</PortalPanelManager>
    </LayoutManagerContext.Provider>
  );
}

/**
 * Dashboard plugin that registers the PortalPanel type for deephaven.ui
 *
 * It's also responsible for handling legacy behaviour, for old dashboards that may have opened a deephaven.ui widget previously.
 * @param props Dashboard plugin props
 * @returns Dashboard plugin
 */
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
