import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IrisGridModel,
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
  closePivotServiceWidget,
  pickPivotServiceDescriptor,
} from './resolvePivotService';
import { useWaitForWorkerVariables } from './useWaitForWorkerVariables';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderMiddleware'
);

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

    // Push-based PSP availability mirrors the panel-path middleware: subscribe
    // to the worker's variable list via `useWorkerVariables` and wait for the
    // first non-null snapshot before the lazy fetch picks the PivotService
    // descriptor. The wait avoids racing the initial subscription when the
    // user applies a pivot before the field-updates stream has flushed.
    const workerVariables = useWorkerVariables(
      metadata as DhType.ide.VariableDescriptor | null | undefined
    );
    const waitForWorkerVariables = useWaitForWorkerVariables(workerVariables);

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
