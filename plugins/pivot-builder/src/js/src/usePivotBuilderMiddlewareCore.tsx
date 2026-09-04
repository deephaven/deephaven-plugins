import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import {
  IrisGridModel,
  type IrisGridModelTransform,
  type IrisGridViewProps,
  type TableOptionsTransform,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  isCorePlusDh,
  usePivotMouseHandlers,
  usePivotRenderer,
  usePivotMetricCalculatorFactory,
  usePivotTheme,
} from '@deephaven/js-plugin-pivot';
import { ToastQueue } from '@deephaven/components';
import Log from '@deephaven/log';
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
  PivotServiceContext,
  type PivotServiceStatus,
} from './PivotServiceContext';
import { addModelListener } from './modelEvents';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/usePivotBuilderMiddlewareCore'
);

/** How long the recoverable pivot build-failure toast stays up, in ms. */
const TOAST_TIMEOUT_MS = 5000;

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
 * transform, gate the pivot IrisGrid overrides on whether the proxy is
 * currently in pivot mode, and surface recoverable pivot build failures as a
 * toast. Only the differences (panel persistence + PSP-status context wrap;
 * widget has neither) stay in the individual middleware components.
 *
 * The model transform is installed on every worker, not just CorePlus: rollup
 * and aggregate (totals) are generic iris-grid features that operate on the
 * source table and work on Legacy workers too. Only the pivot path requires
 * CorePlus and is gated separately (CorePlus availability disables the Pivot
 * card on Core/Legacy, and `augmentPivotBuilderModel`'s `applyPivotConfig`
 * guards the build).
 */
export function usePivotBuilderMiddlewareCore({
  transformTableOptions,
  upstreamTransformModel,
  getPersistedConfig = noPersistedConfig,
}: PivotBuilderMiddlewareCoreParams): PivotBuilderMiddlewareCore {
  const dh = useApi();
  const corePlusAvailable = isCorePlusDh(dh) === true;

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

  // The model transform handed to the host. Augments the host-built proxy into
  // a pivot-builder model (and, for the panel, hydrates persisted config).
  // Stable across renders so the host does not rebuild the model.
  const transformModel = useMemo(
    () =>
      makePivotModelTransform(dh, getPersistedConfig, upstreamTransformModel),
    [dh, getPersistedConfig, upstreamTransformModel]
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

  // Log stale-column notifications: a saved config that references columns
  // which no longer exist has those references excluded from the effective
  // derivation. The sidebar's strikethrough styling is the user-facing signal;
  // here we only `log.warn` the specifics for support (deliberately NO toast).
  //
  // Two sources. (1) A one-time synchronous read of `model.staleColumnReport`:
  // the transform applies the persisted config during hydration — before this
  // effect can attach any listener and before `CreatePivotPage` mounts — so
  // the `PIVOT_BUILDER_STALE_COLUMNS` event it dispatches then has no
  // listeners. The synchronous snapshot is the only way to catch that. (2) The
  // `PIVOT_BUILDER_STALE_COLUMNS` listener handles LATER live edits made
  // through the sidebar after mount. This effect runs once per genuine model
  // swap (`model` only changes on `onModelChanged`), so it cannot spam on
  // re-renders.
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
      log.warn('Stale columns found during hydration', report);
    }
    return addModelListener(model, PIVOT_BUILDER_STALE_COLUMNS, (e: Event) => {
      const { rollupColumns, totalsColumns, pivotColumns } = (
        e as CustomEvent<PivotBuilderStaleColumnsDetail>
      ).detail;
      log.warn('Stale columns excluded from saved pivot/rollup config', {
        rollupColumns,
        totalsColumns,
        pivotColumns,
      });
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
  // per-path duplication). Pivot is a CorePlus-only feature; Core and Legacy
  // workers get the Pivot card disabled. CorePlus always exposes the
  // PivotService, so availability tracks the API flavor directly.
  const pivotServiceStatus: PivotServiceStatus = corePlusAvailable
    ? 'ready'
    : 'unavailable';

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
