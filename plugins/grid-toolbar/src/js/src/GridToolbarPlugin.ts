// TODO: Replace with imports from '@deephaven/plugin' after deephaven/web-client-ui#2660 merges
import {
  MIDDLEWARE_PLUGIN_TYPE,
  type WidgetMiddlewarePlugin,
} from './middlewareTypes';
import { GridToolbarMiddleware } from './GridToolbarMiddleware';
import { GridToolbarPanelMiddleware } from './GridToolbarPanelMiddleware';

export const GridToolbarPlugin: WidgetMiddlewarePlugin = {
  name: '@deephaven/js-plugin-grid-toolbar',
  type: MIDDLEWARE_PLUGIN_TYPE,
  supportedTypes: [
    'Table',
    'TreeTable',
    'HierarchicalTable',
    'PartitionedTable',
  ],
  component: GridToolbarMiddleware,
  panelComponent: GridToolbarPanelMiddleware,
};

export default GridToolbarPlugin;
