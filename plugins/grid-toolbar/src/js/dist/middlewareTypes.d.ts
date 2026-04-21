/**
 * Local type definitions for middleware plugin types.
 *
 * TODO: Delete this file after deephaven/web-client-ui#2660 is merged and
 * @deephaven/plugin is updated with WidgetMiddlewarePlugin types.
 * Replace imports with: import { type WidgetMiddlewarePlugin, type WidgetMiddlewareComponentProps } from '@deephaven/plugin';
 */
import type { WidgetComponentProps, WidgetPanelProps, WidgetPlugin } from '@deephaven/plugin';
/**
 * Props passed to middleware components that wrap a base widget.
 */
export interface WidgetMiddlewareComponentProps<T = unknown> extends WidgetComponentProps<T> {
    /** The next component in the middleware chain. */
    Component: React.ComponentType<WidgetComponentProps<T>>;
}
/**
 * Props passed to middleware panel components that wrap a base panel.
 */
export interface WidgetMiddlewarePanelProps<T = unknown> extends WidgetPanelProps<T> {
    /** The next panel component in the middleware chain. */
    Component: React.ComponentType<WidgetPanelProps<T>>;
}
/**
 * A middleware plugin that wraps and enhances another widget plugin.
 */
export interface WidgetMiddlewarePlugin<T = unknown> extends Omit<WidgetPlugin<T>, 'component' | 'panelComponent'> {
    isMiddleware: true;
    component: React.ComponentType<WidgetMiddlewareComponentProps<T>>;
    panelComponent?: React.ComponentType<WidgetMiddlewarePanelProps<T>>;
}
//# sourceMappingURL=middlewareTypes.d.ts.map