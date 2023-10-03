import React, { useCallback, useEffect, useMemo, useState } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  useListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import ElementPanel from './ElementPanel';
import styles from './styles.scss?inline';
import { JsWidget } from './WidgetTypes';
import PortalPanel from './PortalPanel';
import WidgetHandler from './WidgetHandler';

const NAME_ELEMENT = 'deephaven.ui.Element';

const log = Log.module('@deephaven/js-plugin-ui.DashboardPlugin');

export function DashboardPlugin({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element | null {
  // Keep track of the widgets we've got opened.
  const [widgetMap, setWidgetMap] = useState<
    ReadonlyMap<string, () => Promise<JsWidget>>
  >(new Map());
  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      metadata = {},
      panelId = shortid.generate(),
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
      log.info('Opening element with ID', panelId);
      const newWidgetMap = new Map<string, () => Promise<JsWidget>>(widgetMap);
      // Use the panelId to track the widget mapping, as that's already plumbed through and we can then replace the document fairly easily
      newWidgetMap.set(panelId, fetch);
      setWidgetMap(newWidgetMap);
    },
    []
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(ElementPanel.displayName, ElementPanel),
      registerComponent(PortalPanel.displayName, PortalPanel),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  // TODO: We need to change up the event system for how objects are opened, since in this case it could be opening multiple panels
  useListener(layout.eventHub, 'PanelEvent.OPEN', handlePanelOpen);

  const widgetHandlers = useMemo(
    () =>
      [...widgetMap.entries()].map(([panelId, fetch]) => (
        <WidgetHandler key={panelId} fetch={fetch} layout={layout} />
      )),
    [layout, widgetMap]
  );

  return (
    <>
      <style>{styles}</style>
      {widgetHandlers}
    </>
  );
}

export default DashboardPlugin;
