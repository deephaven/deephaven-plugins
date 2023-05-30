import { useCallback, useEffect } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  useListener,
} from '@deephaven/dashboard';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import PlotlyChartPanel from './PlotlyChartPanel';

const PANEL_COMPONENT = 'PlotlyChartPanel';

const PLOTLY_WIDGET_TYPE = 'plotly.figure';

export type JsWidget = {
  type: string;
  getDataAsBase64: () => string;
};

export function DashboardPlugin(
  props: DashboardPluginComponentProps
): React.ReactNode {
  const { id, layout, registerComponent } = props;
  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: React.DragEvent;
      fetch: () => Promise<unknown>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { name, type } = widget;

      if ((type as string) !== PLOTLY_WIDGET_TYPE) {
        return;
      }

      const metadata = { name, figure: name, type };

      const config = {
        type: 'react-component' as const,
        component: PANEL_COMPONENT,
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

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [registerComponent(PANEL_COMPONENT, PlotlyChartPanel)];
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
