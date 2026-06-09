import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
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
import type {
  WidgetComponentProps,
  WidgetMiddlewareComponentProps,
} from '@deephaven/plugin';
import { isPivotBuilderIrisGridModel } from './pivotBuilderModel';
import { makeCreatePivotTransform } from './makeCreatePivotTransform';
import { makePivotModelTransform } from './makePivotModelTransform';
import { type IrisGridTableOptionsWidgetProps } from './tableOptionsTypes';
import { type IrisGridModelWidgetProps } from './modelTypes';

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
    theme?: Record<string, unknown>;
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
export function PivotBuilderMiddleware({
  Component,
  transformTableOptions,
  transformModel: upstreamTransformModel,
  ...props
}: WidgetMiddlewareComponentProps<DhType.Table> &
  IrisGridTableOptionsWidgetProps &
  IrisGridModelWidgetProps): JSX.Element {
  const { metadata } = props;
  const dh = useApi();
  const corePlusAvailable = isCorePlusDh(dh) === true;
  const objectFetcher = useObjectFetcher();

  // Pivot overrides. Hooks must be unconditional. Renderer / mouse handlers /
  // metric calculator are routed through the proxy model itself (the host
  // reads `model.getRenderer` / `model.getMouseHandlers` /
  // `model.getMetricCalculator`), so they swap synchronously with the inner
  // model. Theme is the lone React-state-driven override.
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
      throw new Error('Cannot fetch PivotService: widget metadata is missing');
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
            pivotOverrides,
            undefined,
            upstreamTransformModel
          )
        : upstreamTransformModel,
    [
      corePlusAvailable,
      dh,
      getPspWidget,
      pivotOverrides,
      upstreamTransformModel,
    ]
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
      target.removeEventListener(IrisGridModel.EVENT.COLUMNS_CHANGED, handler);
    };
  }, [model]);

  if (!corePlusAvailable) {
    log.debug('CorePlus not available; rendering wrapped widget');
  }

  // `Component` is typed for the generic widget props; widen locally to
  // forward the IrisGrid-aware props.
  const Next = Component as ComponentType<ChainedWidgetProps>;

  return (
    <Next
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      transformModel={transformModel}
      transformTableOptions={composedTransform}
      theme={isPivot ? (pivotTheme as Record<string, unknown>) : undefined}
      onModelChanged={setModel}
    />
  );
}

export default PivotBuilderMiddleware;
