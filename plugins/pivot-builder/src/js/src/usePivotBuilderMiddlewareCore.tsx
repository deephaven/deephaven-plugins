import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import {
  IrisGridModel,
  type IrisGridModelTransform,
  type IrisGridViewProps,
  type TableOptionsTransform,
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
import { ToastQueue } from '@deephaven/components';
import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  isPivotBuilderIrisGridModel,
  PIVOT_BUILDER_ERROR,
  PIVOT_BUILDER_STALE_COLUMNS,
  type PivotBuilderConfig,
  type PivotBuilderErrorDetail,
  type PivotBuilderStaleColumnsDetail,
} from './pivotBuilderModel';
import { makeCreatePivotTransform } from './makeCreatePivotTransform';
import { makePivotModelTransform } from './makePivotModelTransform';
import {
  closePivotServiceWidget,
  pickPivotServiceDescriptor,
  PIVOT_SERVICE_TYPE,
} from './resolvePivotService';
import {
  PivotServiceContext,
  type PivotServiceStatus,
} from './PivotServiceContext';
import { useWaitForWorkerVariables } from './useWaitForWorkerVariables';
import { addModelListener } from './modelEvents';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/usePivotBuilderMiddlewareCore'
);

/** How long the recoverable pivot build-failure toast stays up, in ms. */
const TOAST_TIMEOUT_MS = 5000;

/**
 * Generic stale-columns toast wording. Intentionally carries no column or
 * section names (see the plan's Resolved decision #2) — the specifics are
 * logged via `log.debug` for support instead of cluttering the toast.
 */
const STALE_COLUMNS_MESSAGE =
  'Some columns in the saved configuration no longer exist and were removed.';

/** Stable no-op persisted-config reader for paths that don't persist (widget). */
function noPersistedConfig(): PivotBuilderConfig | null {
  return null;
}

/** Best-effort extraction of a human-readable message from an unknown error. */
function getErrorMessage(error: unknown): string {
  if (error == null) {
    return '';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return String(error);
}

export interface PivotBuilderMiddlewareCoreParams {
  /** The widget/panel metadata used to route the PivotService fetch. */
  metadata: DhType.ide.VariableDescriptor | null | undefined;
  /** Upstream Table Options transform threaded down the middleware chain. */
  transformTableOptions: TableOptionsTransform | undefined;
  /** Upstream model transform threaded down the middleware chain. */
  upstreamTransformModel: IrisGridModelTransform | undefined;
  /**
   * Reads the latest persisted builder config (or `null`). Pass a stable
   * function (e.g. a ref reader) so the model transform's identity doesn't
   * change when the persisted value changes. Omit on paths that don't persist.
   */
  getPersistedConfig?: () => PivotBuilderConfig | null;
}

export interface PivotBuilderMiddlewareCore {
  /** Model transform to inject: augments the host model into a pivot proxy. */
  transformModel: IrisGridModelTransform;
  /** Table Options transform to inject: contributes the unified Pivot page. */
  composedTransform: TableOptionsTransform;
  /** Pivot-specific IrisGrid overrides, or `undefined` when not in pivot mode. */
  irisGridProps: Partial<IrisGridViewProps> | undefined;
  /** Wire to the host's `onModelChanged` so the core can track the model. */
  onModelChanged: (model: IrisGridModel) => void;
  /** The current host model (for callers that layer persistence on top). */
  model: IrisGridModel | null;
  /**
   * Wrap the middleware's rendered child in the PivotService availability
   * context so the sidebar `CreatePivotPage` sees the same status on both the
   * widget and panel paths.
   */
  wrap: (child: ReactElement) => ReactElement;
}

/**
 * Shared body for the widget- and panel-path pivot-builder middlewares.
 *
 * Both paths augment the host-built model into a `PivotBuilderProxyModel`,
 * compose the unified Create Pivot Table Options page on top of any upstream
 * transform, lazily resolve the CorePlus PivotService widget, gate the pivot
 * IrisGrid overrides on whether the proxy is currently in pivot mode, and
 * surface recoverable pivot build failures as a toast. Only the
 * differences (panel persistence + PSP-status context wrap; widget has
 * neither) stay in the individual middleware components.
 *
 * The model transform is installed on every worker, not just CorePlus: rollup
 * and aggregate (totals) are generic iris-grid features that operate on the
 * source table and work on Legacy workers too. Only the pivot path requires
 * CorePlus and is gated separately (the PSP availability probe disables the
 * Pivot card, and `augmentPivotBuilderModel`'s `applyPivotConfig` guards the
 * build).
 */
export function usePivotBuilderMiddlewareCore({
  metadata,
  transformTableOptions,
  upstreamTransformModel,
  getPersistedConfig = noPersistedConfig,
}: PivotBuilderMiddlewareCoreParams): PivotBuilderMiddlewareCore {
  const dh = useApi();
  const corePlusAvailable = isCorePlusDh(dh) === true;
  const objectFetcher = useObjectFetcher();

  // Pivot overrides. Hooks must be unconditional. The renderer, mouse
  // handlers, metric-calculator factory, and theme are passed to the host as
  // plain props (gated on `isPivot`); the host guards the renderer and mouse
  // handlers against a transient model mismatch, and resets moved columns on
  // the proxy's `SCHEMA_CHANGED` event, so a one-frame prop lag is cosmetic.
  const pivotMouseHandlers = usePivotMouseHandlers();
  const pivotRenderer = usePivotRenderer();
  const pivotMetricCalculator = usePivotMetricCalculatorFactory();
  const pivotTheme = usePivotTheme();
  const [model, setModel] = useState<IrisGridModel | null>(null);
  const [isPivot, setIsPivot] = useState(false);

  // Compose our Pivot contribution on top of any upstream transform.
  const composedTransform = useMemo(
    () => makeCreatePivotTransform(transformTableOptions),
    [transformTableOptions]
  );

  // Stash latest `metadata` / `objectFetcher` in refs so the lazy PSP fetcher
  // keeps a stable identity and the transform does not change.
  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;
  const objectFetcherRef = useRef(objectFetcher);
  objectFetcherRef.current = objectFetcher;
  const pspWidgetRef = useRef<DhType.Widget | null>(null);
  const unmountedRef = useRef(false);

  // Close the cached PivotService widget when the middleware unmounts so the
  // fetched service handle (and any objects it exported) is released
  // server-side, honoring the `useWidget` ownership contract.
  useEffect(
    () => () => {
      unmountedRef.current = true;
      closePivotServiceWidget(pspWidgetRef.current);
      pspWidgetRef.current = null;
    },
    []
  );

  // Push-based PSP availability: subscribe to the worker's variable list and
  // wait for the first non-null snapshot before the lazy fetch picks the
  // PivotService descriptor. The wait avoids racing the initial subscription
  // when the model transform runs (restoring a persisted pivot) before the
  // field-updates stream has flushed.
  const workerVariables = useWorkerVariables(metadata);
  const waitForWorkerVariables = useWaitForWorkerVariables(workerVariables);

  const getPspWidget = useCallback(async (): Promise<DhType.Widget> => {
    if (pspWidgetRef.current != null) {
      return pspWidgetRef.current;
    }
    const md = metadataRef.current;
    if (md == null) {
      throw new Error('Cannot fetch PivotService: widget metadata is missing');
    }
    const variables = await waitForWorkerVariables();
    const descriptor = pickPivotServiceDescriptor(md, variables);
    if (descriptor == null) {
      throw new Error('PivotService not available on this worker');
    }
    const widget = await objectFetcherRef.current<DhType.Widget>(descriptor);
    if (unmountedRef.current) {
      // The middleware unmounted while the fetch was in flight. The cleanup
      // effect already ran and will never see this widget, so close it here
      // instead of caching it to avoid leaking the server-side handle.
      closePivotServiceWidget(widget);
      throw new Error('PivotService fetch aborted: middleware unmounted');
    }
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

  // The model transform handed to the host. Augments the host-built proxy into
  // a pivot-builder model (and, for the panel, hydrates persisted config).
  // Stable across renders so the host does not rebuild the model.
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

  // Track whether the proxy is currently in pivot mode (gates the pivot theme,
  // renderer, mouse handlers, and metric-calculator factory). Read from the
  // applied inner model (`pivotConfig`) on COLUMNS_CHANGED, which every
  // pivot-on/off transition dispatches after its model swap settles.
  useEffect(() => {
    if (model == null) {
      setIsPivot(false);
      return undefined;
    }
    const update = (): void => {
      const next =
        isPivotBuilderIrisGridModel(model) && model.pivotConfig != null;
      setIsPivot(prev => (prev === next ? prev : next));
    };
    update();
    return addModelListener(model, IrisGridModel.EVENT.COLUMNS_CHANGED, update);
  }, [model]);

  // Surface recoverable pivot build failures as a global toast. The model has
  // already contained the failure (reverted to a safe config) and dispatches
  // `PIVOT_BUILDER_ERROR` instead of the host's `REQUEST_FAILED`, so the panel
  // stays usable and we only need to notify the user. We use the host's global
  // Spectrum `ToastQueue` singleton (re-exported from `@deephaven/components`),
  // which renders into the single themed `<ToastContainer />` the host app
  // already mounts.
  useEffect(() => {
    if (model == null) {
      return undefined;
    }
    return addModelListener(model, PIVOT_BUILDER_ERROR, (e: Event) => {
      const { detail } = e as CustomEvent<PivotBuilderErrorDetail>;
      const reason = getErrorMessage(detail.error);
      log.error(
        'Pivot build failed; reverted to a safe config',
        reason,
        detail
      );
      const message = 'The saved pivot could not be applied and was reverted.';
      ToastQueue.negative(reason !== '' ? `${message} ${reason}` : message, {
        timeout: TOAST_TIMEOUT_MS,
      });
    });
  }, [model]);

  // Surface stale-column notifications: a saved config that references columns
  // which no longer exist has those references sanitized out before reaching
  // the host/service, and we notify the user so the silent trimming is visible.
  //
  // Two sources, one message. (1) A one-time synchronous read of
  // `model.staleColumnReport`: the transform applies the persisted config
  // during hydration — before this effect can attach any listener and before
  // `CreatePivotPage` mounts — so the `PIVOT_BUILDER_STALE_COLUMNS` event it
  // dispatches then has no listeners. The synchronous snapshot is the only way
  // to catch that (the reported bug). (2) The `PIVOT_BUILDER_STALE_COLUMNS`
  // listener handles LATER live edits made through the sidebar after mount.
  // This effect runs once per genuine model swap (`model` only changes on
  // `onModelChanged`), so it cannot spam on re-renders.
  useEffect(() => {
    if (model == null || !isPivotBuilderIrisGridModel(model)) {
      return undefined;
    }
    const report = model.staleColumnReport;
    if (
      report.rollupColumns.length +
        report.totalsColumns.length +
        report.pivotColumns.length >
      0
    ) {
      log.debug('Stale columns found during hydration', report);
      ToastQueue.negative(STALE_COLUMNS_MESSAGE, { timeout: TOAST_TIMEOUT_MS });
    }
    return addModelListener(model, PIVOT_BUILDER_STALE_COLUMNS, (e: Event) => {
      const { rollupColumns, totalsColumns, pivotColumns } = (
        e as CustomEvent<PivotBuilderStaleColumnsDetail>
      ).detail;
      log.debug('Stale columns dropped from saved pivot/rollup config', {
        rollupColumns,
        totalsColumns,
        pivotColumns,
      });
      ToastQueue.negative(STALE_COLUMNS_MESSAGE, { timeout: TOAST_TIMEOUT_MS });
    });
  }, [model]);

  const irisGridProps = useMemo<Partial<IrisGridViewProps> | undefined>(
    () =>
      isPivot
        ? ({
            theme: pivotTheme as Record<string, unknown>,
            renderer: pivotRenderer,
            mouseHandlers: pivotMouseHandlers,
            getMetricCalculator: pivotMetricCalculator,
          } as Partial<IrisGridViewProps>)
        : undefined,
    [
      isPivot,
      pivotTheme,
      pivotRenderer,
      pivotMouseHandlers,
      pivotMetricCalculator,
    ]
  );

  // PivotService availability, derived once here so both the widget- and
  // panel-path middlewares expose it to the sidebar identically (no
  // per-path duplication).
  const pivotServiceStatus: PivotServiceStatus = useMemo(() => {
    if (!corePlusAvailable) return 'unavailable';
    if (workerVariables == null) return 'loading';
    return workerVariables.some(v => v.type === PIVOT_SERVICE_TYPE)
      ? 'ready'
      : 'unavailable';
  }, [corePlusAvailable, workerVariables]);

  // Drop the cached PSP widget whenever the worker stops publishing a
  // PivotService variable (e.g. a restart onto a worker without PSP, or the
  // user closed the service). The next Apply re-fetches.
  useEffect(() => {
    if (pivotServiceStatus !== 'ready') {
      resetPspWidget();
    }
  }, [pivotServiceStatus, resetPspWidget]);

  const pivotServiceContextValue = useMemo(
    () => ({ status: pivotServiceStatus }),
    [pivotServiceStatus]
  );
  const wrap = useCallback(
    (child: ReactElement): ReactElement => (
      <PivotServiceContext.Provider value={pivotServiceContextValue}>
        {child}
      </PivotServiceContext.Provider>
    ),
    [pivotServiceContextValue]
  );

  return {
    transformModel,
    composedTransform,
    irisGridProps,
    onModelChanged: setModel,
    model,
    wrap,
  };
}

export default usePivotBuilderMiddlewareCore;
