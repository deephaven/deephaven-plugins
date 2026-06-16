import {
  forwardRef,
  type ComponentType,
  type ForwardRefExoticComponent,
  type ReactElement,
  type RefAttributes,
} from 'react';
import type { WidgetComponentProps, WidgetPanelProps } from '@deephaven/plugin';

/**
 * TEMPORARY LOCAL COPY.
 *
 * These helpers (and the two middleware prop types below) are duplicated from
 * `@deephaven/plugin` (see `PluginUtils.tsx` / `PluginTypes.ts` in web-client-ui).
 * The upstream package version installed here predates them, so we vendor a copy
 * to unblock plugin development. Delete this file and import from
 * `@deephaven/plugin` once a web-client-ui release that exports them is published.
 */

/**
 * Props passed to middleware components that wrap a base widget.
 * Extends WidgetComponentProps with the wrapped component.
 */
export interface WidgetMiddlewareComponentProps<T = unknown>
  extends WidgetComponentProps<T> {
  /**
   * The next component in the middleware chain.
   * Middleware should render this component to continue the chain.
   */
  Component: ComponentType<WidgetComponentProps<T>>;
}

/**
 * Props passed to middleware panel components that wrap a base panel.
 * Extends WidgetPanelProps with the wrapped panel component.
 */
export interface WidgetMiddlewarePanelProps<T = unknown>
  extends WidgetPanelProps<T> {
  /**
   * The next panel component in the middleware chain.
   * Middleware should render this component to continue the chain.
   *
   * This is ref-capable: middleware that transparently wraps a single inner
   * panel should forward its own `ref` to this component. Golden-layout binds
   * a ref to the registered panel to persist class-component state into its
   * `componentState`; if a middleware swallows the ref, the wrapped panel's
   * state (sorts, filters, column moves, etc.) is never serialized and is lost
   * on reload.
   */
  Component: ForwardRefExoticComponent<
    WidgetPanelProps<T> & RefAttributes<unknown>
  >;
}

/**
 * TEMPORARY LOCAL COPY.
 *
 * `PluginType.MIDDLEWARE_PLUGIN` and the {@link WidgetMiddlewarePlugin}
 * descriptor were added to `@deephaven/plugin` in web-client-ui but the
 * upstream package version installed here predates them. The host runtime
 * (which provides the externalized `@deephaven/plugin`) recognizes the
 * `'MiddlewarePlugin'` discriminator, so we vendor the literal and the
 * descriptor shape here to unblock development. Delete these and import
 * `PluginType` / `WidgetMiddlewarePlugin` from `@deephaven/plugin` once a
 * web-client-ui release that exports them is published.
 */
export const MIDDLEWARE_PLUGIN = 'MiddlewarePlugin' as const;

/**
 * A middleware plugin that can wrap and enhance another widget plugin. Mirrors
 * `WidgetMiddlewarePlugin` from `@deephaven/plugin`. Standalone (rather than
 * `extends Plugin`) because the installed `Plugin.type` union does not yet
 * include the middleware discriminator. The component prop generics are left
 * permissive (`any`) so concretely-typed middleware components (e.g. a
 * `Table`-specific `component` alongside an `unknown` `panelComponent`) remain
 * assignable; the real upstream type is generic over a single widget type `T`.
 */
export interface WidgetMiddlewarePlugin {
  name: string;
  type: typeof MIDDLEWARE_PLUGIN;
  /** The middleware component that wraps the base widget component. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<WidgetMiddlewareComponentProps<any>>;
  /** The server widget types this middleware applies to. */
  supportedTypes: string | string[];
  /** Optional middleware panel component that wraps the base panel component. */
  panelComponent?: ForwardRefExoticComponent<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WidgetMiddlewarePanelProps<any> & RefAttributes<unknown>
  >;
}

/**
 * What a middleware body hook returns. Both fields are optional:
 *
 * - `inject`: extra props merged onto the wrapped `Component`, threaded down
 *   the middleware chain. Use it to forward IrisGrid-aware props (e.g.
 *   `transformModel`, `transformTableOptions`, `onModelChanged`) without
 *   hand-writing the widening cast on `Component`.
 * - `wrap`: an optional wrapper placed *around* the wrapped component (e.g. a
 *   context provider). Receives the already-rendered child element and must
 *   return an element that renders it.
 */
export interface MiddlewareBodyResult {
  inject?: Record<string, unknown>;
  wrap?: (child: ReactElement) => ReactElement;
}

/**
 * A hook implementing the body of a middleware. Receives the incoming props
 * (without `Component`) and returns an optional set of props to inject plus an
 * optional wrapper. The same body hook can back both a panel and a widget
 * middleware (see {@link createPanelMiddleware} / {@link createWidgetMiddleware}),
 * so a plugin expresses its behavior once.
 *
 * Type the `props` parameter as wide as the middleware needs (e.g. intersect
 * with `IrisGridTableOptionsWidgetProps`) — the factory passes the runtime
 * props through unchanged.
 */
export type MiddlewareBody<P> = (props: P) => MiddlewareBodyResult;

/**
 * Builds a panel-path middleware component from a single body hook, owning the
 * `forwardRef` ceremony and ref forwarding that golden-layout state persistence
 * depends on.
 *
 * The returned component is ref-capable and always forwards its `ref` to the
 * wrapped `Component`, so a middleware author can never accidentally drop it
 * (which would silently break `componentState` persistence — sorts, filters,
 * column moves — on reload). The body hook only decides what to inject and how
 * to wrap; it never sees the ref.
 */
export function createPanelMiddleware<
  T = unknown,
  P extends WidgetPanelProps<T> = WidgetPanelProps<T>,
>(
  useBody: MiddlewareBody<P>,
  displayName = 'PanelMiddleware'
): ForwardRefExoticComponent<
  WidgetMiddlewarePanelProps<T> & RefAttributes<unknown>
> {
  const PanelMiddleware = forwardRef<unknown, WidgetMiddlewarePanelProps<T>>(
    ({ Component, ...rest }, ref) => {
      const { inject, wrap } = useBody(rest as unknown as P);
      const Next = Component as unknown as ForwardRefExoticComponent<
        Record<string, unknown> & RefAttributes<unknown>
      >;
      const child = (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Next ref={ref} {...rest} {...inject} />
      );
      return wrap != null ? wrap(child) : child;
    }
  );
  PanelMiddleware.displayName = displayName;
  return PanelMiddleware;
}

/**
 * Builds a widget-path middleware component from a single body hook. The widget
 * path takes no ref, so this is a plain function component; otherwise it mirrors
 * {@link createPanelMiddleware} (same `inject` / `wrap` contract), letting a
 * plugin reuse one body hook for both paths.
 */
export function createWidgetMiddleware<
  T = unknown,
  P extends WidgetComponentProps<T> = WidgetComponentProps<T>,
>(
  useBody: MiddlewareBody<P>,
  displayName = 'WidgetMiddleware'
): ComponentType<WidgetMiddlewareComponentProps<T>> {
  function WidgetMiddleware({
    Component,
    ...rest
  }: WidgetMiddlewareComponentProps<T>): ReactElement {
    const { inject, wrap } = useBody(rest as unknown as P);
    const Next = Component as unknown as ComponentType<Record<string, unknown>>;
    const child = (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Next {...rest} {...inject} />
    );
    return wrap != null ? wrap(child) : child;
  }
  WidgetMiddleware.displayName = displayName;
  return WidgetMiddleware;
}
