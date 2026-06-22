import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IrisGridModel,
  type IrisGridModelWidgetProps,
  type IrisGridTableOptionsWidgetProps,
  type IrisGridViewProps,
} from '@deephaven/iris-grid';
import * as JsapiBootstrap from '@deephaven/jsapi-bootstrap';
import { useApi, useObjectFetcher } from '@deephaven/jsapi-bootstrap';
import {
  isCorePlusDh,
  usePivotMouseHandlers,
  usePivotRenderer,
  usePivotMetricCalculatorFactory,
  usePivotTheme,
} from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  createWidgetMiddleware,
  type WidgetComponentProps,
} from '@deephaven/plugin';
import { isPivotBuilderIrisGridModel } from './pivotBuilderModel';
import { makeCreatePivotTransform } from './makeCreatePivotTransform';
import { makePivotModelTransform } from './makePivotModelTransform';
import {
  type VariableDefinitionFinder,
  closePivotServiceWidget,
  resolvePivotServiceDescriptor,
} from './resolvePivotService';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderMiddleware'
);

/**
 * The host's optional variable-finder hook. Resolved defensively at module load
 * so the plugin runs on host versions that predate
 * `useVariableDefinitionFinder`: on older hosts the fallback returns `null` and
 * the PivotService is reported unavailable. The chosen function is stable for
 * the module's lifetime, so calling it unconditionally each render keeps the
 * hook order consistent.
 */
const useVariableFinderSafe: () => VariableDefinitionFinder | null =
  typeof (JsapiBootstrap as { useVariableDefinitionFinder?: unknown })
    .useVariableDefinitionFinder === 'function'
    ? (
        JsapiBootstrap as unknown as {
          useVariableDefinitionFinder: () => VariableDefinitionFinder | null;
        }
      ).useVariableDefinitionFinder
    : () => null;

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
 * When CorePlus is unavailable (open-source DH) we omit `transformModel`, so
 * the host renders a plain table while the Create Pivot page surfaces an
 * error if opened.
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
    const { metadata } = props;
    const dh = useApi();
    const corePlusAvailable = isCorePlusDh(dh) === true;
    const objectFetcher = useObjectFetcher();
    // Host hook (when present) to find the PivotService variable by type, so
    // the service may be published under any name.
    const findField = useVariableFinderSafe();

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
    const findFieldRef = useRef(findField);
    findFieldRef.current = findField;
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

    const getPspWidget = useCallback(async (): Promise<DhType.Widget> => {
      if (pspWidgetRef.current != null) {
        return pspWidgetRef.current;
      }
      const md = metadataRef.current;
      if (md == null) {
        throw new Error(
          'Cannot fetch PivotService: widget metadata is missing'
        );
      }
      // Discover the PivotService descriptor from the host variable finder
      // (matched by type, so the service may be published under any name).
      const descriptor = await resolvePivotServiceDescriptor(
        md as DhType.ide.VariableDescriptor,
        findFieldRef.current
      );
      if (descriptor == null) {
        throw new Error('PivotService not available on this worker');
      }
      const widget = await objectFetcherRef.current<DhType.Widget>(descriptor);
      pspWidgetRef.current = widget;
      return widget;
    }, []);

    // Drop any cached PivotService widget so the next fetch re-resolves it,
    // closing the stale handle first so it is released server-side. The
    // transform calls this on model re-builds (worker/query restart) to avoid
    // building the pivot against a widget bound to the dead worker.
    const resetPspWidget = useCallback(() => {
      closePivotServiceWidget(pspWidgetRef.current);
      pspWidgetRef.current = null;
    }, []);

    // The model transform handed to the host. Augments the host-built proxy
    // into a pivot-builder model. Stable across renders so the host does not
    // rebuild the model. Installed on every worker (not just CorePlus): rollup
    // and aggregate (totals) are generic iris-grid features that work on Legacy
    // too. Only the pivot path requires CorePlus and is gated separately (the
    // guard in `augmentPivotBuilderModel`'s `applyPivotConfig`).
    const transformModel = useMemo(
      () =>
        makePivotModelTransform(
          dh,
          getPspWidget,
          undefined,
          upstreamTransformModel,
          resetPspWidget
        ),
      [dh, getPspWidget, upstreamTransformModel, resetPspWidget]
    );

    // Track whether the proxy is currently in pivot mode (used to gate the
    // pivot theme override). The model is received
    // via `onModelChanged`.
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
      const target = model as unknown as {
        addEventListener: (type: string, fn: () => void) => void;
        removeEventListener: (type: string, fn: () => void) => void;
      };
      const handler = (): void => update();
      target.addEventListener(IrisGridModel.EVENT.COLUMNS_CHANGED, handler);
      return () => {
        target.removeEventListener(
          IrisGridModel.EVENT.COLUMNS_CHANGED,
          handler
        );
      };
    }, [model]);

    if (!corePlusAvailable) {
      log.debug('CorePlus not available; rendering wrapped widget');
    }

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
    };
  },
  'PivotBuilderMiddleware'
);

export default PivotBuilderMiddleware;
