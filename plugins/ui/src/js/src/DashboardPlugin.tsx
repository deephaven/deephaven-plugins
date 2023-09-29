import React, { useCallback, useEffect } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import ElementPanel from './ElementPanel';
import styles from './styles.scss?inline';

const NAME_ELEMENT = 'deephaven.ui.Element';

const log = Log.module('@deephaven/js-plugin-ui.DashboardPlugin');

export function DashboardPlugin({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element | null {
  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      metadata = {},
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: React.DragEvent;
      fetch: () => Promise<unknown>;
      metadata?: Record<string, unknown>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { id: widgetId, name, type } = widget;
      if ((type as string) !== NAME_ELEMENT) {
        // Only want to listen for matplotlib panels
        return;
      }
      log.info('Panel opened of type', type);
      const config = {
        type: 'react-component' as const,
        component: ElementPanel.displayName,
        props: {
          localDashboardId: id,
          id: panelId,
          metadata: {
            ...metadata,
            id: widgetId,
            name,
            type,
          },
          fetch,
        },
        title: name,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [id, layout]
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(ElementPanel.displayName, ElementPanel),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  useListener(layout.eventHub, 'PanelEvent.OPEN', handlePanelOpen);

  return <style>{styles}</style>;
}

export default DashboardPlugin;
