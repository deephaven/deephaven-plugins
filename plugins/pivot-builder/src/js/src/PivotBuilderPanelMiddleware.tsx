import { useCallback, useEffect, useRef } from 'react';
import {
  type IrisGridModel,
  type IrisGridModelWidgetProps,
  type IrisGridTableOptionsWidgetProps,
  type IrisGridViewProps,
} from '@deephaven/iris-grid';
import { usePersistentState } from '@deephaven/dashboard';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  createPanelMiddleware,
  type WidgetPanelProps,
} from '@deephaven/plugin';
import {
  isPivotBuilderIrisGridModel,
  PIVOT_BUILDER_CONFIG_CHANGED,
  type PivotBuilderConfig,
  type PivotConfig,
} from './pivotBuilderModel';
import { usePivotBuilderMiddlewareCore } from './usePivotBuilderMiddlewareCore';
import { addModelListener } from './modelEvents';

/**
 * IrisGrid-aware opt-in props the chained panel host (`IrisGridPanel`, via the
 * base `GridPanelPlugin`) accepts on top of the generic `WidgetPanelProps`.
 * `transformModel` (`IrisGridModelWidgetProps`) and `transformTableOptions`
 * (`IrisGridTableOptionsWidgetProps`) are published opt-in props from
 * `@deephaven/iris-grid`, deliberately kept off the generic panel prop surface
 * so middleware intersects them in. `irisGridProps` / `onModelChanged` mirror
 * the host panel's inline middleware props, which aren't re-exported from the
 * package root, so we declare them inline here.
 */
type ChainedPanelProps = WidgetPanelProps<DhType.Table> &
  IrisGridTableOptionsWidgetProps &
  IrisGridModelWidgetProps & {
    irisGridProps?: Partial<IrisGridViewProps>;
    onModelChanged?: (model: IrisGridModel) => void;
  };

/**
 * Panel-path middleware.
 *
 * A **chained** middleware: it renders the wrapped `Component` (the base
 * `IrisGridPanel`) and injects a `transformModel` that augments the
 * host-built model into a `PivotBuilderIrisGridModel`, plus a composed
 * `transformTableOptions` that contributes the unified Pivot page. The
 * sidebar drives the inner model swap via the proxy's `pivotConfig` setter
 * (mirrors how rollups work) without the pivot-builder mounting its own
 * `IrisGridPanel`.
 *
 * The CorePlus pivot service widget is fetched lazily on first `pivotConfig`
 * apply — that way the panel mounts identically on workers with and without
 * PSP. The proxy is installed on every worker (rollup and aggregate work on
 * Legacy too); only the CorePlus-only pivot path is gated — the PSP
 * availability probe disables the Pivot card, so the Create Pivot page renders
 * but pivots can't be requested where PSP is absent.
 *
 * Built with `createPanelMiddleware`, which owns the `forwardRef` ceremony and
 * forwards the `ref` golden-layout injects on the registered panel to the next
 * panel in the chain (the inner `IrisGridPanel` class). That ref is how
 * golden-layout persists the panel's React state (sorts, filters, column moves,
 * etc.) into its `componentState`; the factory guarantees it can't be dropped,
 * so the view survives reload. The body hook only declares what to `inject` and
 * a `wrap` that exposes the PSP status via context.
 */
export const PivotBuilderPanelMiddleware = createPanelMiddleware<
  DhType.Table,
  ChainedPanelProps
>(
  ({
    transformTableOptions,
    transformModel: upstreamTransformModel,
    ...props
  }) => {
    // Persist the applied builder config (pivot + rollup + totals) per
    // panel so reloads / dashboard rehydration restore the user's view.
    // Bumped to v2 when persistence widened from `pivotConfig` to the full
    // `PivotBuilderConfig`. v1 entries hold a bare `PivotConfig | null`;
    // wrap them into the v2 envelope with empty rollup/totals.
    const [persistedConfig, setPersistedConfig] =
      usePersistentState<PivotBuilderConfig | null>(null, {
        type: 'PivotBuilderPanel',
        version: 2,
        migrations: [
          {
            from: 1,
            migrate: (state: unknown): PivotBuilderConfig | null => {
              if (state == null) return null;
              return {
                pivot: state as PivotConfig,
                rollup: null,
                totals: null,
              };
            },
          },
        ],
      });

    // Keep latest persisted config in a ref so the transform can read it once
    // per model build without re-running every time it changes.
    const persistedConfigRef = useRef(persistedConfig);
    persistedConfigRef.current = persistedConfig;
    const getPersistedConfig = useCallback(
      () => persistedConfigRef.current,
      []
    );

    // Shared middleware core: model augmentation, lazy PSP resolution, pivot
    // IrisGrid overrides, and the recoverable-error toast. The panel passes
    // `getPersistedConfig` so the transform hydrates persisted state before the
    // model is published.
    const {
      transformModel,
      composedTransform,
      irisGridProps,
      onModelChanged,
      model,
      wrap,
    } = usePivotBuilderMiddlewareCore({
      metadata: props.metadata as
        | DhType.ide.VariableDescriptor
        | null
        | undefined,
      transformTableOptions,
      upstreamTransformModel,
      getPersistedConfig,
    });

    // Persist the current builder config on every change so reloads restore
    // the user's view. `isPivot` (theme/renderer gating) is tracked by the
    // shared core; here we only mirror config changes into panel state.
    //
    // Subscribed after the model is published, so the transform's own
    // hydration dispatch (which applies the already-persisted state) has
    // already fired and is not echoed back — only genuine post-mount user
    // changes are persisted.
    useEffect(() => {
      if (model == null || !isPivotBuilderIrisGridModel(model)) {
        return undefined;
      }
      return addModelListener(
        model,
        PIVOT_BUILDER_CONFIG_CHANGED,
        (e: Event) => {
          setPersistedConfig((e as CustomEvent<PivotBuilderConfig>).detail);
        }
      );
    }, [model, setPersistedConfig]);

    // `transformModel` is installed on every worker, so the host always gets a
    // pivot-builder proxy (rollup/aggregate work on Legacy; the Pivot card is
    // gated by the PSP probe). The factory owns the `forwardRef` ceremony and
    // forwards the ref golden-layout injects to the inner `IrisGridPanel`, so
    // panel state (sorts, filters, column moves, etc.) persists; we only declare
    // what to inject and a `wrap` that exposes the PSP status via context.
    return {
      inject: {
        transformModel,
        transformTableOptions: composedTransform,
        irisGridProps,
        onModelChanged,
      },
      wrap,
    };
  },
  'PivotBuilderPanelMiddleware'
);

export default PivotBuilderPanelMiddleware;
