import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IrisGridPanel,
  useLoadTablePlugin,
} from '@deephaven/dashboard-core-plugins';
import {
  IrisGridModel,
  IrisGridTableOptionsContext,
} from '@deephaven/iris-grid';
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
import { type WidgetMiddlewarePanelProps } from '@deephaven/plugin';
import {
  isPivotBuilderIrisGridModel,
  makePivotBuilderModel,
  type PivotConfig,
} from './pivotBuilderModel';
import { useComposedTableOptionsExtension } from './useComposedTableOptionsExtension';
import {
  PivotServiceContext,
  type PivotServiceStatus,
} from './PivotServiceContext';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderPanelMiddleware'
);

/**
 * Panel-path middleware.
 *
 * Renders our own `IrisGridPanel` backed by `PivotBuilderIrisGridModel` so
 * the sidebar `Create Pivot` page can drive the inner model swap via the
 * proxy's `pivotConfig` setter (mirrors how rollups work) without changing
 * the host IrisGrid. The CorePlus pivot service widget is fetched lazily on
 * first `pivotConfig` apply — that way the panel mounts identically on
 * workers with and without PSP, and we never unmount/remount the inner
 * IrisGridPanel mid-fetch based on a transient PSP fetch state. When
 * CorePlus itself is unavailable (open-source DH) we fall back to wrapping
 * the host `Component` since `makePivotBuilderModel` requires DHE.
 */
export function PivotBuilderPanelMiddleware({
  Component,
  ...props
}: WidgetMiddlewarePanelProps): JSX.Element {
  const { fetch, metadata, localDashboardId, glContainer, glEventHub } = props;
  const dh = useApi();
  const extension = useComposedTableOptionsExtension();
  const loadPlugin = useLoadTablePlugin();
  const corePlusAvailable = isCorePlusDh(dh) === true;
  const objectFetcher = useObjectFetcher();

  // Pivot overrides. Hooks must be unconditional. The renderer / mouse
  // handlers / metric-calculator factory are forwarded to the host via
  // `model.getRenderer` / `model.getMouseHandlers` / `model.getMetricCalculator`,
  // which the host evaluates synchronously on each access — so swaps stay
  // race-free with the model swap without needing a ref. Theme is the lone
  // React-state-driven override since the host has no model-side hook for it.
  const pivotMouseHandlers = usePivotMouseHandlers();
  const pivotRenderer = usePivotRenderer();
  const pivotMetricCalculator = usePivotMetricCalculatorFactory();
  const pivotTheme = usePivotTheme();
  const pivotOverrides = useMemo(
    () => ({
      getMetricCalculator: pivotMetricCalculator,
      renderer: pivotRenderer,
      mouseHandlers: pivotMouseHandlers,
    }),
    [pivotMetricCalculator, pivotRenderer, pivotMouseHandlers]
  );
  const [model, setModel] = useState<IrisGridModel | null>(null);
  const [isPivot, setIsPivot] = useState(false);

  // Persist the applied `pivotConfig` per panel so reloads / dashboard
  // rehydration restore the user's pivot. Stored value is the same
  // `PivotConfig` shape consumed by `PivotBuilderProxyModel.pivotConfig`.
  const [persistedConfig, setPersistedConfig] =
    usePersistentState<PivotConfig | null>(null, {
      type: 'PivotBuilderPanel',
      version: 1,
    });

  // Keep latest persisted config in a ref so the hydration effect can read
  // it once per `model` swap without re-running every time it changes.
  const persistedConfigRef = useRef(persistedConfig);
  persistedConfigRef.current = persistedConfig;

  // Stash the latest `fetch` / `metadata` / `objectFetcher` in refs so the
  // lazy PSP fetcher and makeModel keep stable identities and IrisGridPanel
  // does not re-init on every parent re-render.
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;
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
    useState<PivotServiceStatus>(corePlusAvailable ? 'loading' : 'unavailable');

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
  }, [corePlusAvailable, metadata, objectFetcher]);

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

  const makeModel = useCallback(async () => {
    const table = (await fetchRef.current()) as DhType.Table;
    log.info('Constructing pivot builder proxy model');
    const built = await makePivotBuilderModel(
      dh,
      table,
      getPspWidget,
      pivotOverrides
    );
    // Hydrate persisted pivotConfig synchronously *before* publishing the
    // model. Doing this here (instead of via a post-mount effect) avoids a
    // race where the COLUMNS_CHANGED listener fires once with
    // `pivotConfig === null` and writes `null` back over the persisted
    // value before hydration runs.
    const persisted = persistedConfigRef.current;
    if (persisted != null) {
      try {
        log.info('Restoring persisted pivot config', persisted);
        built.pivotConfig = persisted;
      } catch (err) {
        log.warn('Failed to restore persisted pivot config', err);
      }
    }
    setModel(built);
    return built;
    // pivotOverrides is stable (all source hooks useMemo with []); getPspWidget
    // is stable (refs carry latest fetcher/metadata).
  }, [dh, getPspWidget, pivotOverrides]);

  // Track whether the proxy is currently in pivot mode (used only to gate
  // the pivot theme override on the panel; renderer / mouse handlers /
  // metric calculator are routed through the proxy itself so they swap
  // synchronously with the inner model and don't race React renders).
  // Also persists the current pivotConfig on every change so reloads
  // restore the user's pivot.
  useEffect(() => {
    if (model == null) {
      setIsPivot(false);
      return undefined;
    }
    // Sync the initial render-time isPivot value, but DO NOT persist on
    // mount: `makeModel` has already applied any persisted state and the
    // first COLUMNS_CHANGED event after mount typically reflects the
    // hydrated state, which is the same value we just read.
    setIsPivot(isPivotBuilderIrisGridModel(model) && model.pivotConfig != null);
    const handler = (): void => {
      const next =
        isPivotBuilderIrisGridModel(model) && model.pivotConfig != null;
      setIsPivot(prev => (prev === next ? prev : next));
      if (isPivotBuilderIrisGridModel(model)) {
        setPersistedConfig(model.pivotConfig);
      }
    };
    model.addEventListener(IrisGridModel.EVENT.COLUMNS_CHANGED, handler);
    return () => {
      model.removeEventListener(IrisGridModel.EVENT.COLUMNS_CHANGED, handler);
    };
  }, [model, setPersistedConfig]);

  // Fallback: CorePlus not available -> render the wrapped Component (still
  // providing the sidebar extension so we surface the Create Pivot page,
  // which will display an error if the user opens it). This branch is
  // deterministic from `dh`, so it never flips at runtime — no
  // unmount/remount of the inner panel.
  if (!corePlusAvailable) {
    log.debug('CorePlus not available; rendering wrapped panel');
    return (
      <PivotServiceContext.Provider value="unavailable">
        <IrisGridTableOptionsContext.Provider value={extension}>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component {...props} />
        </IrisGridTableOptionsContext.Provider>
      </PivotServiceContext.Provider>
    );
  }

  return (
    <PivotServiceContext.Provider value={pivotServiceStatus}>
      <IrisGridTableOptionsContext.Provider value={extension}>
        <IrisGridPanel
          localDashboardId={localDashboardId}
          glContainer={glContainer}
          glEventHub={glEventHub}
          metadata={metadata}
          makeModel={makeModel}
          loadPlugin={loadPlugin}
          theme={isPivot ? pivotTheme : undefined}
        />
      </IrisGridTableOptionsContext.Provider>
    </PivotServiceContext.Provider>
  );
}

export default PivotBuilderPanelMiddleware;
