import { PluginType } from '@deephaven/plugin';
import { GridToolbarMiddleware } from './GridToolbarMiddleware';
import { GridToolbarPanelMiddleware } from './GridToolbarPanelMiddleware';
export const GridToolbarPlugin = {
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
//# sourceMappingURL=GridToolbarPlugin.js.map