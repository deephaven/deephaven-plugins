import Log from '@deephaven/log';
import type { WidgetMiddlewareComponentProps } from '@deephaven/plugin';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { PivotBuilderWidget } from './PivotBuilderWidget';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderMiddleware'
);

/**
 * Middleware for the non-panel widget path (e.g. `GridWidgetPlugin`).
 *
 * Note: this middleware **replaces** the downstream `Component`. It owns
 * the `IrisGrid` mount so the proxy model can intercept Table Options
 * actions. Anything contributed further down the middleware chain by way
 * of `Component` is intentionally dropped for this spike.
 */
export function PivotBuilderMiddleware(
  props: WidgetMiddlewareComponentProps<DhType.Table>
): JSX.Element {
  log.debug('Replacing default Table widget with pivot builder');
  // Strip the wrapped `Component` — we render IrisGrid ourselves.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { Component: _Component, ...rest } = props;
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <PivotBuilderWidget {...rest} />;
}

export default PivotBuilderMiddleware;
