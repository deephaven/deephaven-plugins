import { PluginType, type WidgetMiddlewarePlugin } from '@deephaven/plugin';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { PivotBuilderMiddleware } from './PivotBuilderMiddleware';
import { PivotBuilderPanelMiddleware } from './PivotBuilderPanelMiddleware';

export const PivotBuilderPlugin: WidgetMiddlewarePlugin<DhType.Table> = {
  name: '@deephaven/js-plugin-pivot-builder',
  type: PluginType.MIDDLEWARE_PLUGIN,
  // Spike: flat `Table` widgets only. Tree/hierarchical/partitioned tables
  // cannot be pivoted by `PivotService.createPivotTable` today.
  supportedTypes: ['Table'],
  component: PivotBuilderMiddleware,
  panelComponent: PivotBuilderPanelMiddleware,
};

export default PivotBuilderPlugin;
