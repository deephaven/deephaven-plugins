import { PluginType } from '@deephaven/plugin';
// TODO: Replace with import from '@deephaven/plugin' after deephaven/web-client-ui#2660 merges
import type { WidgetMiddlewarePlugin } from './middlewareTypes';
import { GridToolbarMiddleware } from './GridToolbarMiddleware';
import { GridToolbarPanelMiddleware } from './GridToolbarPanelMiddleware';

export const GridToolbarPlugin: WidgetMiddlewarePlugin = {
  name: '@deephaven/js-plugin-grid-toolbar',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: [
    'Table',
    'TreeTable',
    'HierarchicalTable',
    'PartitionedTable',
  ],
  component: GridToolbarMiddleware,
  panelComponent: GridToolbarPanelMiddleware,
  isMiddleware: true,
};

export default GridToolbarPlugin;
