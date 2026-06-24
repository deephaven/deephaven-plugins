import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type IrisGridModel,
  type IrisGridModelWidgetProps,
  type IrisGridTableOptionsWidgetProps,
  type IrisGridViewProps,
} from '@deephaven/iris-grid';
import {
  useApi,
  useObjectFetcher,
  useWorkerVariables,
} from '@deephaven/jsapi-bootstrap';
import {
  isCorePlusDh,
  usePivotMouseHandlers,
  usePivotRenderer,
  usePivotMetricCalculatorFactory,
  usePivotTheme,
} from '@deephaven/js-plugin-pivot';
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
import { makeCreatePivotTransform } from './makeCreatePivotTransform';
import { makePivotModelTransform } from './makePivotModelTransform';
import {
  PivotServiceContext,
  type PivotServiceStatus,
} from './PivotServiceContext';
import {
  PIVOT_SERVICE_TYPE,
  closePivotServiceWidget,
  pickPivotServiceDescriptor,
} from './resolvePivotService';
import { useWaitForWorkerVariables } from './useWaitForWorkerVariables';

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
    const { metadata } = props;
    const dh = useApi();
    const corePlusAvailable = isCorePlusDh(dh) === true;
    const objectFetcher = useObjectFetcher();

    // Pivot overrides. Hooks must be unconditional. The renderer, mouse
    // handlers, metric-calculator factory, and theme are passed to the host as
    // plain props (gated on `isPivot`); the host guards the renderer and mouse
    // handlers against a transient model mismatch, and resets moved columns on
    // the proxy's `MODEL_CHANGED` event, so a one-frame prop lag is cosmetic.
    const pivotMouseHandlers = usePivotMouseHandlers();
    const pivotRenderer = usePivotRenderer();
    const pivotMetricCalculator = usePivotMetricCalculatorFactory();
    const pivotTheme = usePivotTheme();
    const [model, setModel] = useState<IrisGridModel | null>(null);
    const [isPivot, setIsPivot] = useState(false);

    // Compose our Pivot contribution on top of any transform threaded down
    // the middleware chain.
    const composedTransform = useMemo(
      () => makeCreatePivotTransform(transformTableOptions),
      [transformTableOptions]
    );

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

    // Stash the latest `metadata` / `objectFetcher` in refs so the lazy PSP
    // fetcher keeps a stable identity and the transform does not change.
    const metadataRef = useRef(metadata);
    metadataRef.current = metadata;
    const objectFetcherRef = useRef(objectFetcher);
    objectFetcherRef.current = objectFetcher;

    // Cache the resolved PSP widget from the eager probe so the Apply path
    // can reuse it without re-fetching.
    const pspWidgetRef = useRef<DhType.Widget | null>(null);

    // Close the cached PivotService widget when the middleware unmounts so the
    // fetched service handle (and any objects it exported) is released
    // server-side, honoring the `useWidget` ownership contract.
    useEffect(
      () => () => {
        closePivotServiceWidget(pspWidgetRef.current);
        pspWidgetRef.current = null;
      },
      []
    );

    const workerVariables = useWorkerVariables(
      metadata as DhType.ide.VariableDescriptor | null | undefined
    );
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
      if (pivotServiceStatus !== 'ready' && pspWidgetRef.current != null) {
        closePivotServiceWidget(pspWidgetRef.current);
        pspWidgetRef.current = null;
      }
    }, [pivotServiceStatus]);

    // Bridge the push snapshot into an awaitable for the lazy fetcher: the
    // model transform runs as the panel opens (especially when restoring a
    // persisted pivot config), often before `workerVariables` has flushed its
    // first delta. The hook drains queued resolvers when a non-null snapshot
    // arrives, so `getPspWidget` no longer races the variable list.
    const waitForWorkerVariables = useWaitForWorkerVariables(workerVariables);

    const pivotServiceContextValue = useMemo(
      () => ({
        status: pivotServiceStatus,
      }),
      [pivotServiceStatus]
    );

    const getPspWidget = useCallback(async (): Promise<DhType.Widget> => {
      if (pspWidgetRef.current != null) {
        return pspWidgetRef.current;
      }
      const md = metadataRef.current;
      if (md == null) {
        throw new Error('Cannot fetch PivotService: panel metadata is missing');
      }
      const variables = await waitForWorkerVariables();
      const descriptor = pickPivotServiceDescriptor(
        md as DhType.ide.VariableDescriptor,
        variables
      );
      if (descriptor == null) {
        throw new Error('PivotService not available on this worker');
      }
      const widget = await objectFetcherRef.current<DhType.Widget>(descriptor);
      pspWidgetRef.current = widget;
      return widget;
    }, [waitForWorkerVariables]);

    // Drop any cached PivotService widget so the next fetch re-resolves it,
    // closing the stale handle first so it is released server-side. The
    // transform calls this on model re-builds (worker/query restart) to avoid
    // building the pivot against a widget bound to the dead worker.
    const resetPspWidget = useCallback(() => {
      closePivotServiceWidget(pspWidgetRef.current);
      pspWidgetRef.current = null;
    }, []);

    // The model transform handed to the host panel. Augments the host-built
    // proxy into a pivot-builder model and hydrates any persisted config
    // synchronously before the model is published. Stable across renders
    // (all inputs are stable) so the host does not rebuild the model — it is
    // applied once per (re)build, never on this prop's identity changing.
    //
    // Installed on every worker, not just CorePlus: rollup and aggregate
    // (totals) are generic iris-grid features that operate on the source table
    // and work on Legacy workers too. Only the pivot path requires CorePlus,
    // and it's gated separately (the PSP availability probe disables the Pivot
    // card, and `applyPivotConfig` guards the build). Gating the whole proxy on
    // CorePlus would dead-end rollup/aggregate on Legacy (the sidebar's
    // `applyPivotBuilderConfig` calls become no-ops without the proxy).
    const transformModel = useMemo(
      () =>
        makePivotModelTransform(
          dh,
          getPspWidget,
          getPersistedConfig,
          upstreamTransformModel,
          resetPspWidget
        ),
      [
        dh,
        getPspWidget,
        getPersistedConfig,
        upstreamTransformModel,
        resetPspWidget,
      ]
    );

    // Track whether the proxy is currently in pivot mode. Gates the pivot theme,
    // renderer, mouse handlers, and metric-calculator factory passed to the host
    // as props. These tolerate this `isPivot` snapshot lagging the model swap by
    // a frame because the host guards the renderer/mouse handlers against a
    // transient model mismatch and resets moved columns on the proxy's
    // `MODEL_CHANGED` event.
    // Also persists the current builder config on every change so reloads
    // restore the user's view. The model is received via `onModelChanged`.
    useEffect(() => {
      if (model == null || !isPivotBuilderIrisGridModel(model)) {
        setIsPivot(false);
        return undefined;
      }
      // Sync the initial render-time isPivot value, but DO NOT persist on
      // mount: the transform has already applied any persisted state.
      setIsPivot(model.builderConfig.pivot != null);
      const handler = (e: Event): void => {
        const cfg = (e as CustomEvent<PivotBuilderConfig>).detail;
        setIsPivot(prev =>
          prev === (cfg.pivot != null) ? prev : cfg.pivot != null
        );
        setPersistedConfig(cfg);
      };
      // The model uses the dh event shim, whose listener type differs from the
      // DOM `Event` used by our handler; bridge with an isolated cast (the shim
      // dispatches a standard `CustomEvent` at runtime).
      const target = model as unknown as {
        addEventListener: (type: string, fn: (e: Event) => void) => void;
        removeEventListener: (type: string, fn: (e: Event) => void) => void;
      };
      target.addEventListener(PIVOT_BUILDER_CONFIG_CHANGED, handler);
      return () => {
        target.removeEventListener(PIVOT_BUILDER_CONFIG_CHANGED, handler);
      };
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
        irisGridProps: isPivot
          ? {
              theme: pivotTheme as Record<string, unknown>,
              renderer: pivotRenderer,
              mouseHandlers: pivotMouseHandlers,
              getMetricCalculator: pivotMetricCalculator,
            }
          : undefined,
        onModelChanged: setModel,
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
