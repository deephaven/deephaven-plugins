import React, { type DragEvent, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';
import {
  type DashboardPluginComponentProps,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import type { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import PivotPanel from './PivotPanel';

const VARIABLE_TYPE = 'PivotTable';

const log = Log.module('@deephaven/js-plugin-pivot/DashboardPlugin');

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
      panelId = nanoid(),
      widget,
    }: {
      dragEvent?: DragEvent;
      fetch: () => Promise<dh.Widget>;
      metadata?: Record<string, unknown>;
      panelId?: string;
      widget: dh.ide.VariableDescriptor;
    }) => {
      const { name, type } = widget;
      if (type !== VARIABLE_TYPE) {
        // Ignore unsupported panel types
        return;
      }
      log.info('Panel opened of type', type);
      const config = {
        type: 'react-component' as const,
        component: PivotPanel.displayName,
        props: {
          localDashboardId: id,
          id: panelId,
          metadata: {
            ...metadata,
            ...widget,
          },
          fetch,
        },
        title: name ?? undefined,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [id, layout]
  );

  useEffect(() => {
    assertNotNull(PivotPanel.displayName);
    const cleanups = [registerComponent(PivotPanel.displayName, PivotPanel)];
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  useListener(layout.eventHub, 'PanelEvent.OPEN', handlePanelOpen);

  return null;
}

export default DashboardPlugin;
