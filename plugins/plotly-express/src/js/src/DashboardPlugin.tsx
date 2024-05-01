import { useCallback, DragEvent, useEffect } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  useListener,
} from '@deephaven/dashboard';
import type { dh } from '@deephaven/jsapi-types';
import PlotlyExpressChartPanel from './PlotlyExpressChartPanel.js';
import type { PlotlyChartWidget } from './PlotlyExpressChartUtils.js';

export function DashboardPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  const { id, layout, registerComponent } = props;

  const handlePanelOpen = useCallback(
    async ({
      dragEvent,
      fetch,
      metadata = {},
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: DragEvent;
      fetch: () => Promise<PlotlyChartWidget>;
      metadata?: Record<string, unknown>;
      panelId?: string;
      widget: dh.ide.VariableDescriptor;
    }) => {
      const { type, name } = widget;
      if (type !== 'deephaven.plot.express.DeephavenFigure') {
        return;
      }

      const config = {
        type: 'react-component' as const,
        component: 'PlotlyPanel',
        props: {
          localDashboardId: id,
          id: panelId,
          metadata: {
            ...metadata,
            ...widget,
            figure: name,
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

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent('PlotlyPanel', PlotlyExpressChartPanel),
      ];
      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [registerComponent]
  );

  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);

  return null;
}

export default DashboardPlugin;
