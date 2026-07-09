import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { WorkerVariables } from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  isPivotBuilderIrisGridModel,
  PIVOT_BUILDER_ERROR,
  type PivotBuilderConfig,
  type PivotBuilderErrorDetail,
} from './pivotBuilderModel';
import { makeCreatePivotTransform } from './makeCreatePivotTransform';
import { makePivotModelTransform } from './makePivotModelTransform';
import {
  closePivotServiceWidget,
  pickPivotServiceDescriptor,
} from './resolvePivotService';
import { useWaitForWorkerVariables } from './useWaitForWorkerVariables';
import { addModelListener } from './modelEvents';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/usePivotBuilderMiddlewareCore'
);

/** Stable no-op persisted-config reader for paths that don't persist (widget). */
function noPersistedConfig(): PivotBuilderConfig | null {
  return null;
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
  irisGridProps: IrisGridViewProps | undefined;
  /** Wire to the host's `onModelChanged` so the core can track the model. */
  onModelChanged: (model: IrisGridModel) => void;
  /** The current host model (for callers that layer persistence on top). */
  model: IrisGridModel | null;
  /** Live worker variable snapshot (for deriving PSP availability status). */
  workerVariables: WorkerVariables | null;
  /** Whether the JS API is a CorePlus build (pivot path requires it). */
  corePlusAvailable: boolean;
  /** Drop any cached PivotService widget, closing the stale handle first. */
  resetPspWidget: () => void;
}

/**
 * Shared body for the widget- and panel-path pivot-builder middlewares.
 *
 * Both paths augment the host-built model into a `PivotBuilderProxyModel`,
 * compose the unified Create Pivot Table Options page on top of any upstream
 * transform, lazily resolve the CorePlus PivotService widget, gate the pivot
 * IrisGrid overrides on whether the proxy is currently in pivot mode, and
 * surface recoverable pivot build failures as a non-fatal toast. Only the
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

  // Surface recoverable pivot build failures as a non-fatal toast. The model
  // has already contained the failure (reverted to a safe config) and
  // dispatches `PIVOT_BUILDER_ERROR` instead of the host's `REQUEST_FAILED`,
  // so the panel stays usable and we only need to notify the user.
  useEffect(() => {
    if (model == null) {
      return undefined;
    }
    return addModelListener(model, PIVOT_BUILDER_ERROR, (e: Event) => {
      const { detail } = e as CustomEvent<PivotBuilderErrorDetail>;
      log.warn('Pivot build failed; reverted to a safe config', detail);
      ToastQueue.negative(
        'The saved pivot could not be applied and was reverted.',
        { timeout: 5000 }
      );
    });
  }, [model]);

  const irisGridProps = useMemo<IrisGridViewProps | undefined>(
    () =>
      isPivot
        ? ({
            theme: pivotTheme as Record<string, unknown>,
            renderer: pivotRenderer,
            mouseHandlers: pivotMouseHandlers,
            getMetricCalculator: pivotMetricCalculator,
          } as IrisGridViewProps)
        : undefined,
    [
      isPivot,
      pivotTheme,
      pivotRenderer,
      pivotMouseHandlers,
      pivotMetricCalculator,
    ]
  );

  return {
    transformModel,
    composedTransform,
    irisGridProps,
    onModelChanged: setModel,
    model,
    workerVariables,
    corePlusAvailable,
    resetPspWidget,
  };
}

export default usePivotBuilderMiddlewareCore;
