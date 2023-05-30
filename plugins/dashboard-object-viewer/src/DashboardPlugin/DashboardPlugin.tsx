import React, { useCallback, useEffect } from 'react';
import shortid from 'shortid';
import type { DashboardPluginComponentProps } from '@deephaven/dashboard';
import LayoutUtils from '@deephaven/dashboard/dist/layout/LayoutUtils';
import { useListener } from '@deephaven/dashboard/dist/layout/hooks';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import Log from '@deephaven/log/dist/Log';
import ObjectPanel from './ObjectPanel';
import styles from './ObjectPanel.scss?inline';

const log = Log.module('@deephaven/js-plugin-module-template.DashboardPlugin');

export function DashboardPlugin({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): React.ReactNode {
  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: DragEvent;
      fetch: () => Promise<unknown>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { id: widgetId, name, type } = widget;
      if (type === dh.VariableType.TABLE || type === dh.VariableType.FIGURE) {
        // Just ignore table and figure types - only want interesting other types
        return;
      }
      log.info('Panel opened of type', type);
      const metadata = { id: widgetId, name, type };
      const config = {
        type: 'react-component' as const,
        component: ObjectPanel.COMPONENT,
        props: {
          localDashboardId: id,
          id: panelId,
          metadata,
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
    const cleanups = [registerComponent(ObjectPanel.COMPONENT, ObjectPanel)];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  useListener(layout.eventHub, 'PanelEvent.OPEN', handlePanelOpen);

  return <style>{styles}</style>;
}

export default DashboardPlugin;
