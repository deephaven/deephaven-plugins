import { PluginType, type WidgetMiddlewarePlugin } from '@deephaven/plugin';
import { PivotBuilderMiddleware } from './PivotBuilderMiddleware';
import { PivotBuilderPanelMiddleware } from './PivotBuilderPanelMiddleware';

export const PivotBuilderPlugin: WidgetMiddlewarePlugin = {
  name: '@deephaven/js-plugin-pivot-builder',
  type: PluginType.MIDDLEWARE_PLUGIN,
  // Spike: flat `Table` widgets only. Tree/hierarchical/partitioned tables
  // cannot be pivoted by `PivotService.createPivotTable` today.
  supportedTypes: ['Table'],
  component: PivotBuilderMiddleware,
  panelComponent: PivotBuilderPanelMiddleware,
};

export default PivotBuilderPlugin;
