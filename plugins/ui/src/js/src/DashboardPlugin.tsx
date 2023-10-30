import React, { useCallback, useEffect, useMemo, useState } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  PanelEvent,
  useListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import styles from './styles.scss?inline';
import { JsWidget, WidgetWrapper } from './WidgetTypes';
import PortalPanel from './PortalPanel';
import WidgetHandler from './WidgetHandler';
import LayoutContext from './LayoutContext';

const NAME_ELEMENT = 'deephaven.ui.Element';

const log = Log.module('@deephaven/js-plugin-ui.DashboardPlugin');

export function DashboardPlugin({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element | null {
  // Keep track of the widgets we've got opened.
  const [widgetMap, setWidgetMap] = useState<
    ReadonlyMap<string, WidgetWrapper>
  >(new Map());
  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      metadata = {},
      panelId: widgetId = shortid.generate(),
      widget,
    }: {
      dragEvent?: React.DragEvent;
      fetch: () => Promise<JsWidget>;
      metadata?: Record<string, unknown>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { type } = widget;
      if ((type as string) !== NAME_ELEMENT) {
        // Only want to listen for Element panels trying to be opened
        return;
      }
      log.info('Opening widget with ID', widgetId);
      setWidgetMap(prevWidgetMap => {
        const newWidgetMap = new Map<string, WidgetWrapper>(prevWidgetMap);
        newWidgetMap.set(widgetId, { definition: widget, fetch, id: widgetId });
        return newWidgetMap;
      });
    },
    []
  );

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
    <LayoutContext.Provider value={layout}>
      <style>{styles}</style>
      {widgetHandlers}
    </LayoutContext.Provider>
  );
}

export default DashboardPlugin;
