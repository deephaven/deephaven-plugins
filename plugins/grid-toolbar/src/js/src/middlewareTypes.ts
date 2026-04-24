/**
 * Local type definitions for middleware plugin types.
 *
 * TODO: Delete this file after deephaven/web-client-ui#2660 is merged and
 * @deephaven/plugin is updated with WidgetMiddlewarePlugin types.
 * Replace imports with: import { type WidgetMiddlewarePlugin, type WidgetMiddlewareComponentProps, PluginType } from '@deephaven/plugin';
 */
import type { WidgetComponentProps, WidgetPanelProps } from '@deephaven/plugin';

/**
 * Discriminator value for middleware plugins. Matches
 * `PluginType.MIDDLEWARE_PLUGIN` in the upcoming @deephaven/plugin release.
 */
export const MIDDLEWARE_PLUGIN_TYPE = 'MiddlewarePlugin' as const;

/**
 * Props passed to middleware components that wrap a base widget.
 */
export interface WidgetMiddlewareComponentProps<T = unknown>
  extends WidgetComponentProps<T> {
  /** The next component in the middleware chain. */
  Component: React.ComponentType<WidgetComponentProps<T>>;
}

/**
 * Props passed to middleware panel components that wrap a base panel.
 */
export interface WidgetMiddlewarePanelProps<T = unknown>
  extends WidgetPanelProps<T> {
  /** The next panel component in the middleware chain. */
  Component: React.ComponentType<WidgetPanelProps<T>>;
}

/**
 * A middleware plugin that wraps and enhances another widget plugin.
 *
 * Note: does not `extend Plugin` because the published @deephaven/plugin's
 * `Plugin.type` is a strict union that doesn't yet include the new
 * `MIDDLEWARE_PLUGIN` discriminator. After web-client-ui#2660 merges this
 * file is deleted and consumers import from @deephaven/plugin directly.
 */
export interface WidgetMiddlewarePlugin<T = unknown> {
  name: string;
  type: typeof MIDDLEWARE_PLUGIN_TYPE;
  supportedTypes: string | string[];
  component: React.ComponentType<WidgetMiddlewareComponentProps<T>>;
  panelComponent?: React.ComponentType<WidgetMiddlewarePanelProps<T>>;
}
