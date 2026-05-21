import { PluginType, type WidgetMiddlewarePlugin } from '@deephaven/plugin';
import { TableOptionsExampleMiddleware } from './TableOptionsExampleMiddleware';
import { TableOptionsExamplePanelMiddleware } from './TableOptionsExamplePanelMiddleware';

export const TableOptionsExamplePlugin: WidgetMiddlewarePlugin = {
  name: '@deephaven/js-plugin-table-options-example',
  type: PluginType.MIDDLEWARE_PLUGIN,
  supportedTypes: [
    'Table',
    'TreeTable',
    'HierarchicalTable',
    'PartitionedTable',
  ],
  component: TableOptionsExampleMiddleware,
  panelComponent: TableOptionsExamplePanelMiddleware,
};

export default TableOptionsExamplePlugin;
