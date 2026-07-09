import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import {
  PivotServiceContext,
  type PivotServiceStatus,
} from './PivotServiceContext';
import { PIVOT_SERVICE_TYPE } from './resolvePivotService';
import { usePivotBuilderMiddlewareCore } from './usePivotBuilderMiddlewareCore';
import { addModelListener } from './modelEvents';

/**
 * Extra IrisGrid-aware props the chained panel host (`IrisGridPanel`, via the
 * base `GridPanelPlugin`) accepts. `transformModel` / `transformTableOptions`
 * are added to `@deephaven/iris-grid` in web-client-ui; widen locally until
 * that version is published and installed.
 */
type ChainedPanelProps = WidgetPanelProps<DhType.Table> &
  IrisGridTableOptionsWidgetProps &
  IrisGridModelWidgetProps & {
    irisGridProps?: IrisGridViewProps;
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
      workerVariables,
      corePlusAvailable,
      resetPspWidget,
    } = usePivotBuilderMiddlewareCore({
      metadata: props.metadata as
        | DhType.ide.VariableDescriptor
        | null
        | undefined,
      transformTableOptions,
      upstreamTransformModel,
      getPersistedConfig,
    });

    const pivotServiceStatus: PivotServiceStatus = useMemo(() => {
      if (!corePlusAvailable) return 'unavailable';
      if (workerVariables == null) return 'loading';
      return workerVariables.some(v => v.type === PIVOT_SERVICE_TYPE)
        ? 'ready'
        : 'unavailable';
    }, [corePlusAvailable, workerVariables]);

    // Drop the cached PSP widget whenever the host worker no longer publishes
    // a PivotService variable (e.g. the query restarted onto a worker without
    // PSP, or the user closed the service). The next Apply will re-fetch.
    useEffect(() => {
      if (pivotServiceStatus !== 'ready') {
        resetPspWidget();
      }
    }, [pivotServiceStatus, resetPspWidget]);

    const pivotServiceContextValue = useMemo(
      () => ({
        status: pivotServiceStatus,
      }),
      [pivotServiceStatus]
    );

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
      wrap: child => (
        <PivotServiceContext.Provider value={pivotServiceContextValue}>
          {child}
        </PivotServiceContext.Provider>
      ),
    };
  },
  'PivotBuilderPanelMiddleware'
);

export default PivotBuilderPanelMiddleware;
