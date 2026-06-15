import {
  type IrisGridModel,
  type IrisGridRenderer,
  type MouseHandlersProp,
  type GetMetricCalculatorType,
} from '@deephaven/iris-grid';

/**
 * Local copy of the model-transform props contract added to
 * `@deephaven/iris-grid` in web-client-ui. Duplicated here until that
 * version is published and installed, at which point these can be replaced
 * with imports from `@deephaven/iris-grid`.
 */

/**
 * Transform applied to the model an IrisGrid host (panel or widget) builds,
 * before it is handed to `<IrisGrid>`. Lets middleware wrap/augment the
 * host-built model without taking over model construction.
 */
export type IrisGridModelTransform = (
  model: IrisGridModel
) => IrisGridModel | Promise<IrisGridModel>;

/**
 * Opt-in prop for components that build an `IrisGridModel` from a `fetch`
 * (e.g. `IrisGridPanel`, `GridWidgetPlugin`), threaded down the middleware
 * chain. Must be referentially stable.
 */
export interface IrisGridModelWidgetProps {
  transformModel?: IrisGridModelTransform;
}

/**
 * Local mirror of `IrisGridViewProps` from `@deephaven/iris-grid`: the bag of
 * view-concern overrides (theme, renderer, mouse handlers, metric calculator)
 * an IrisGrid host forwards to `<IrisGrid>` as a single prop. Duplicated here
 * until that version is published and installed, at which point this can be
 * replaced with an import from `@deephaven/iris-grid`.
 */
export interface IrisGridViewProps {
  theme?: Record<string, unknown>;
  renderer?: IrisGridRenderer;
  mouseHandlers?: MouseHandlersProp;
  getMetricCalculator?: GetMetricCalculatorType;
}
