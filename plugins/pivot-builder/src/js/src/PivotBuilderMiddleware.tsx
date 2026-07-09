import {
  type IrisGridModel,
  type IrisGridModelWidgetProps,
  type IrisGridTableOptionsWidgetProps,
  type IrisGridViewProps,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  createWidgetMiddleware,
  type WidgetComponentProps,
} from '@deephaven/plugin';
import { usePivotBuilderMiddlewareCore } from './usePivotBuilderMiddlewareCore';

/**
 * Extra IrisGrid-aware props the chained widget host (`GridWidgetPlugin`)
 * accepts. `transformModel` / `transformTableOptions` are added to
 * `@deephaven/iris-grid` / `@deephaven/dashboard-core-plugins` in
 * web-client-ui; widen locally until that version is published and installed.
 */
type ChainedWidgetProps = WidgetComponentProps<DhType.Table> &
  IrisGridTableOptionsWidgetProps &
  IrisGridModelWidgetProps & {
    irisGridProps?: IrisGridViewProps;
    onModelChanged?: (model: IrisGridModel) => void;
  };

/**
 * Widget-path middleware (e.g. `GridWidgetPlugin`).
 *
 * A **chained** middleware: it renders the wrapped `Component` (the base
 * `GridWidgetPlugin`) and injects a `transformModel` that augments the
 * host-built model into a `PivotBuilderIrisGridModel`, plus a composed
 * `transformTableOptions` that contributes the unified Pivot page. The
 * sidebar drives the inner model swap via the proxy's `pivotConfig` setter
 * without the pivot-builder mounting its own `IrisGrid`.
 *
 * The widget path does not persist config (there is no panel state to restore
 * into), so it wires the shared core with no `getPersistedConfig`. All shared
 * behavior — model augmentation, lazy PSP resolution, pivot IrisGrid overrides,
 * and the recoverable-error toast — lives in
 * {@link usePivotBuilderMiddlewareCore}.
 */
export const PivotBuilderMiddleware = createWidgetMiddleware<
  DhType.Table,
  ChainedWidgetProps
>(
  ({
    transformTableOptions,
    transformModel: upstreamTransformModel,
    ...props
  }) => {
    const { transformModel, composedTransform, irisGridProps, onModelChanged } =
      usePivotBuilderMiddlewareCore({
        metadata: props.metadata as
          | DhType.ide.VariableDescriptor
          | null
          | undefined,
        transformTableOptions,
        upstreamTransformModel,
      });

    return {
      inject: {
        transformModel,
        transformTableOptions: composedTransform,
        irisGridProps,
        onModelChanged,
      },
    };
  },
  'PivotBuilderMiddleware'
);

export default PivotBuilderMiddleware;
