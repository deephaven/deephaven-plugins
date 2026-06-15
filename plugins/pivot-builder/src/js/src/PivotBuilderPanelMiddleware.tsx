import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type IrisGridModel } from '@deephaven/iris-grid';
import { useApi, useObjectFetcher } from '@deephaven/jsapi-bootstrap';
import {
  isCorePlusDh,
  usePivotMouseHandlers,
  usePivotRenderer,
  usePivotMetricCalculatorFactory,
  usePivotTheme,
} from '@deephaven/js-plugin-pivot';
import { usePersistentState } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { type WidgetPanelProps } from '@deephaven/plugin';
import { createPanelMiddleware } from './createMiddleware';
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
import { type IrisGridTableOptionsWidgetProps } from './tableOptionsTypes';
import {
  type IrisGridModelWidgetProps,
  type IrisGridViewProps,
} from './modelTypes';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderPanelMiddleware'
);

/**
 * Extra IrisGrid-aware props the chained panel host (`IrisGridPanel`, via the
 * base `GridPanelPlugin`) accepts. `transformModel` / `transformTableOptions`
 * are added to `@deephaven/iris-grid` in web-client-ui; widen locally until
 * that version is published and installed.
 */
type ChainedPanelProps = WidgetPanelProps &
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
 * `transformTableOptions` that contributes the Create/Edit Pivot page. The
 * sidebar drives the inner model swap via the proxy's `pivotConfig` setter
 * (mirrors how rollups work) without the pivot-builder mounting its own
 * `IrisGridPanel`.
 *
 * The CorePlus pivot service widget is fetched lazily on first `pivotConfig`
 * apply — that way the panel mounts identically on workers with and without
 * PSP. When CorePlus itself is unavailable (open-source DH) we simply omit
 * `transformModel`, so the host renders a plain table while the Create Pivot
 * page surfaces an error if opened.
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
  unknown,
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

    // Compose our Create/Edit Pivot contribution on top of any transform
    // threaded down the middleware chain. Rebuilt when `isPivot` (a snapshot
    // derived from model events below) changes so `IrisGrid` re-runs the
    // transform and relabels the item without the transform reading the
    // mutable model directly.
    const composedTransform = useMemo(
      () => makeCreatePivotTransform(transformTableOptions, isPivot),
      [transformTableOptions, isPivot]
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

    // Probe PSP availability eagerly via `objectFetcher`. Plugins have no
    // host-agnostic API to inspect the worker's already-known field list
    // (no useConnection / subscribeToFieldUpdates path that works in both
    // DHC and DHE without a host change), so we fall back to a fetch and
    // race it against a short timeout — if the worker has a PSP the fetch
    // resolves quickly; if it doesn't, we surface `unavailable` instead of
    // hanging the Create Pivot page.
    const [pivotServiceStatus, setPivotServiceStatus] =
      useState<PivotServiceStatus>(
        corePlusAvailable ? 'loading' : 'unavailable'
      );

    // Bumped to retry the probe (e.g. after a worker restart surfaces a fresh
    // model). Adding this to the probe effect's deps re-runs it.
    const [probeRetryKey, setProbeRetryKey] = useState(0);

    useEffect(() => {
      if (!corePlusAvailable) {
        setPivotServiceStatus('unavailable');
        return undefined;
      }
      if (metadata == null) {
        return undefined;
      }
      let cancelled = false;
      setPivotServiceStatus('loading');
      const descriptor: DhType.ide.VariableDescriptor = {
        ...metadata,
        type: 'PivotService',
        name: 'psp',
      };
      const PROBE_TIMEOUT_MS = 1500;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('PSP probe timed out')),
          PROBE_TIMEOUT_MS
        );
      });
      Promise.race([objectFetcher<DhType.Widget>(descriptor), timeoutPromise])
        .then(widget => {
          if (cancelled) return;
          pspWidgetRef.current = widget;
          setPivotServiceStatus('ready');
        })
        .catch(err => {
          if (cancelled) return;
          log.debug('PivotService not available', err);
          pspWidgetRef.current = null;
          setPivotServiceStatus('unavailable');
        });
      return () => {
        cancelled = true;
      };
    }, [corePlusAvailable, metadata, objectFetcher, probeRetryKey]);

    // Re-probe when the host publishes a (re)built model and PSP was
    // previously unavailable. Worker restarts surface as a new model from
    // `IrisGridPanel`; if the fresh worker has PSP we want the panel to
    // recognize it without the user reloading. We deliberately skip
    // re-probing once status is `ready` so the happy path doesn't flicker
    // through `loading` on every model swap (we assume PSP doesn't
    // disappear mid-session).
    useEffect(() => {
      if (model != null && pivotServiceStatus === 'unavailable') {
        setProbeRetryKey(k => k + 1);
      }
      // Intentionally only react to `model` changes; `pivotServiceStatus` is
      // read as a snapshot to gate the retry, not to drive it.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model]);

    const getPspWidget = useCallback(async (): Promise<DhType.Widget> => {
      if (pspWidgetRef.current != null) {
        return pspWidgetRef.current;
      }
      const md = metadataRef.current;
      if (md == null) {
        throw new Error('Cannot fetch PivotService: panel metadata is missing');
      }
      const descriptor: DhType.ide.VariableDescriptor = {
        ...md,
        type: 'PivotService',
        name: 'psp',
      };
      const widget = await objectFetcherRef.current<DhType.Widget>(descriptor);
      pspWidgetRef.current = widget;
      return widget;
    }, []);

    // The model transform handed to the host panel. Augments the host-built
    // proxy into a pivot-builder model and hydrates any persisted config
    // synchronously before the model is published. Stable across renders
    // (all inputs are stable) so the host does not rebuild the model — it is
    // applied once per (re)build, never on this prop's identity changing.
    const transformModel = useMemo(
      () =>
        corePlusAvailable
          ? makePivotModelTransform(
              dh,
              getPspWidget,
              getPersistedConfig,
              upstreamTransformModel
            )
          : upstreamTransformModel,
      [
        corePlusAvailable,
        dh,
        getPspWidget,
        getPersistedConfig,
        upstreamTransformModel,
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

    // When CorePlus is unavailable `transformModel` falls back to the upstream
    // transform (often `undefined`), so the host renders a plain table while the
    // Create Pivot page surfaces an error if opened. This branch is deterministic
    // from `dh`, so it never flips at runtime — no unmount/remount of the inner
    // panel. The factory owns the `forwardRef` ceremony and forwards the ref
    // golden-layout injects to the inner `IrisGridPanel`, so panel state (sorts,
    // filters, column moves, etc.) persists; we only declare what to inject and a
    // `wrap` that exposes the PSP status via context.
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
        <PivotServiceContext.Provider
          value={corePlusAvailable ? pivotServiceStatus : 'unavailable'}
        >
          {child}
        </PivotServiceContext.Provider>
      ),
    };
  },
  'PivotBuilderPanelMiddleware'
);

export default PivotBuilderPanelMiddleware;
