import React, { useCallback, useEffect } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import MatPlotLibPanel from './MatPlotLibPanel';
import styles from './MatPlotLibPanel.scss?inline';

const VARIABLE_TYPE = 'matplotlib.figure.Figure';

const log = Log.module('@deephaven/js-plugin-matplotlib.DashboardPlugin');

export function DashboardPlugin({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): React.ReactNode {
  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      metadata = {},
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: DragEvent;
      fetch: () => Promise<unknown>;
      metadata?: Record<string, unknown>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { id: widgetId, name, type } = widget;
      if ((type as string) !== VARIABLE_TYPE) {
        // Only want to listen for matplotlib panels
        return;
      }
      log.info('Panel opened of type', type);
      const config = {
        type: 'react-component' as const,
        component: MatPlotLibPanel.COMPONENT,
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
      registerComponent(MatPlotLibPanel.COMPONENT, MatPlotLibPanel),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  useListener(layout.eventHub, 'PanelEvent.OPEN', handlePanelOpen);

  return <style>{styles}</style>;
}

export default DashboardPlugin;
