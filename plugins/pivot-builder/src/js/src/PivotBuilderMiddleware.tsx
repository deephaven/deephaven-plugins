import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IrisGridModel } from '@deephaven/iris-grid';
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
import type { WidgetComponentProps } from '@deephaven/plugin';
import { createWidgetMiddleware } from './createMiddleware';
import { isPivotBuilderIrisGridModel } from './pivotBuilderModel';
import { makeCreatePivotTransform } from './makeCreatePivotTransform';
import { makePivotModelTransform } from './makePivotModelTransform';
import { type IrisGridTableOptionsWidgetProps } from './tableOptionsTypes';
import {
  type IrisGridModelWidgetProps,
  type IrisGridViewProps,
} from './modelTypes';

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
 * `transformTableOptions` that contributes the Create/Edit Pivot page. The
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
    // the proxy's `MODEL_CHANGED` event, so a one-frame prop lag is cosmetic.
    const pivotMouseHandlers = usePivotMouseHandlers();
    const pivotRenderer = usePivotRenderer();
    const pivotMetricCalculator = usePivotMetricCalculatorFactory();
    const pivotTheme = usePivotTheme();
    const [model, setModel] = useState<IrisGridModel | null>(null);
    const [isPivot, setIsPivot] = useState(false);

    // Compose our Create/Edit Pivot contribution on top of any upstream
    // transform. Rebuilt when `isPivot` (a snapshot derived from model events
    // below) changes so `IrisGrid` re-runs the transform and relabels the item
    // without the transform reading the mutable model directly.
    const composedTransform = useMemo(
      () => makeCreatePivotTransform(transformTableOptions, isPivot),
      [transformTableOptions, isPivot]
    );

    // Stash latest `metadata` / `objectFetcher` in refs so the lazy PSP fetcher
    // keeps a stable identity and the transform does not change.
    const metadataRef = useRef(metadata);
    metadataRef.current = metadata;
    const objectFetcherRef = useRef(objectFetcher);
    objectFetcherRef.current = objectFetcher;
    const pspWidgetRef = useRef<DhType.Widget | null>(null);

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
      const descriptor: DhType.ide.VariableDescriptor = {
        ...md,
        type: 'PivotService',
        name: 'psp',
      };
      const widget = await objectFetcherRef.current<DhType.Widget>(descriptor);
      pspWidgetRef.current = widget;
      return widget;
    }, []);

    // The model transform handed to the host. Augments the host-built proxy
    // into a pivot-builder model. Stable across renders so the host does not
    // rebuild the model.
    const transformModel = useMemo(
      () =>
        corePlusAvailable
          ? makePivotModelTransform(
              dh,
              getPspWidget,
              undefined,
              upstreamTransformModel
            )
          : upstreamTransformModel,
      [corePlusAvailable, dh, getPspWidget, upstreamTransformModel]
    );

    // Track whether the proxy is currently in pivot mode (used to gate the
    // pivot theme override and the Create/Edit relabel). The model is received
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
