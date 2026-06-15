import { PluginType, type WidgetMiddlewarePlugin } from '@deephaven/plugin';
import { ExampleWidgetMiddleware } from './ExampleWidgetMiddleware';
import { ExamplePanelMiddleware } from './ExamplePanelMiddleware';

/**
 * Minimal `WidgetMiddlewarePlugin`. A middleware plugin is inserted into the
 * render chain for every widget whose type matches `supportedTypes`, without
 * the widget opting in. It can wrap the next component and inject props (see
 * `exampleMiddlewareBody`).
 *
 * - `component` handles the non-panel widget path.
 * - `panelComponent` handles the panel path and is ref-capable.
 */
export const ExampleMiddlewarePlugin: WidgetMiddlewarePlugin = {
  name: '@deephaven/js-plugin-table-middleware-example',
  type: PluginType.MIDDLEWARE_PLUGIN,
  supportedTypes: [
    'Table',
    'TreeTable',
    'HierarchicalTable',
    'PartitionedTable',
  ],
  component: ExampleWidgetMiddleware,
  panelComponent: ExamplePanelMiddleware,
};

export default ExampleMiddlewarePlugin;
