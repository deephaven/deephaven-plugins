import deepEqual from 'fast-deep-equal';
import type { GridMouseHandler } from '@deephaven/grid';
import {
  type IrisGridModel,
  IrisGridModelFactory,
  type GetMetricCalculatorType,
  type IrisGridRenderer,
} from '@deephaven/iris-grid';
import {
  IrisGridPivotModel,
  isCorePlusDh,
  isIrisGridPivotModel,
} from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';

/**
 * Pivot-specific overrides supplied by the React layer. Forwarded to the
 * host `IrisGrid` via `model.getMetricCalculator` / `model.getRenderer()` /
 * `model.getMouseHandlers()` whenever the proxy's inner model is a pivot,
 * so swapping in/out happens synchronously with the model swap (no React
 * render lag).
 */
export interface PivotOverrides {
  getMetricCalculator: GetMetricCalculatorType;
  renderer: IrisGridRenderer;
  mouseHandlers: readonly GridMouseHandler[];
}

const log = Log.module('@deephaven/js-plugin-pivot-builder/pivotBuilderModel');

const NUMERIC_TYPES = new Set<string>([
  'int',
  'long',
  'short',
  'byte',
  'double',
  'float',
  'java.lang.Integer',
  'java.lang.Long',
  'java.lang.Short',
  'java.lang.Byte',
  'java.lang.Double',
  'java.lang.Float',
  'java.math.BigDecimal',
  'java.math.BigInteger',
]);

/** Sentinel installed on the proxy so `isPivotBuilderIrisGridModel` works. */
const PIVOT_BUILDER_TAG = Symbol.for(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderProxy'
);

/**
 * User-configured pivot settings. Shape mirrors the request payload accepted
 * by `coreplus.pivot.PivotService#createPivotTable`.
 */
export interface PivotConfig {
  rowKeys: string[];
  columnKeys: string[];
  /** e.g. `{ Sum: ['price', 'qty'] }`. */
  aggregations: Record<string, string[]>;
}

/**
 * An `IrisGridProxyModel` (the host's own proxy) augmented with a
 * `pivotConfig` accessor that swaps its inner model between the flat
 * `IrisGridTableModel` and an `IrisGridPivotModel`.
 */
export interface PivotBuilderProxyModel extends IrisGridModel {
  pivotConfig: PivotConfig | null;
  /** The original (pre-pivot) source table. */
  readonly sourceTable: DhType.Table;
  [PIVOT_BUILDER_TAG]: true;
}

export function isNumericColumn(column: DhType.Column): boolean {
  return NUMERIC_TYPES.has(column.type);
}

export function isPivotBuilderIrisGridModel(
  model: unknown
): model is PivotBuilderProxyModel {
  return (
    typeof model === 'object' &&
    model !== null &&
    (model as { [PIVOT_BUILDER_TAG]?: true })[PIVOT_BUILDER_TAG] === true
  );
}

/**
 * Build an `IrisGridProxyModel` for `table` (using the host factory so we get
 * all the working overrides for free), then install a `pivotConfig` accessor
 * that — when set — produces a pivot via `PivotService.createPivotTable` and
 * hands it to the proxy's `setNextModel`. The proxy fires the standard
 * `COLUMNS_CHANGED` / `UPDATED` events, so IrisGrid re-renders in place
 * exactly like rollups.
 */
export async function makePivotBuilderModel(
  dh: typeof DhType | typeof CorePlusDhType,
  table: DhType.Table,
  getPspWidget: () => Promise<DhType.Widget>,
  pivotOverrides: PivotOverrides
): Promise<PivotBuilderProxyModel> {
  if (!isCorePlusDh(dh)) {
    throw new Error('CorePlus is not available; pivot builder requires DHE');
  }
  const corePlusDh = dh as typeof CorePlusDhType;

  const proxy = (await IrisGridModelFactory.makeModel(
    dh as typeof DhType,
    table
  )) as IrisGridModel & {
    setNextModel(promise: Promise<IrisGridModel>): void;
    // IrisGridProxyModel exposes `originalModel` publicly.
    originalModel: IrisGridModel;
  };

  let current: PivotConfig | null = null;

  Object.defineProperty(proxy, PIVOT_BUILDER_TAG, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  Object.defineProperty(proxy, 'sourceTable', {
    value: table,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  // Synchronously expose pivot overrides to the host IrisGrid whenever the
  // inner model is a pivot model. The host reads `model.getMetricCalculator`
  // (as a property), `model.getRenderer?.()`, and `model.getMouseHandlers?.()`
  // — see IrisGrid.tsx. By switching these on inner-model type at access
  // time we avoid the React render lag where, on pivot reset, the inner
  // table model would briefly be paired with the pivot calculator/renderer
  // (the pivot calculator throws `Model is not an IrisGridPivotModel`).
  Object.defineProperty(proxy, 'getMetricCalculator', {
    configurable: true,
    enumerable: false,
    get(): GetMetricCalculatorType | undefined {
      const target = (proxy as unknown as { model: IrisGridModel }).model;
      return isIrisGridPivotModel(target) === true
        ? pivotOverrides.getMetricCalculator
        : undefined;
    },
  });
  Object.defineProperty(proxy, 'getRenderer', {
    configurable: true,
    enumerable: false,
    value(): IrisGridRenderer | undefined {
      const target = (proxy as unknown as { model: IrisGridModel }).model;
      return isIrisGridPivotModel(target) === true
        ? pivotOverrides.renderer
        : undefined;
    },
  });
  Object.defineProperty(proxy, 'getMouseHandlers', {
    configurable: true,
    enumerable: false,
    value(): readonly GridMouseHandler[] {
      const target = (proxy as unknown as { model: IrisGridModel }).model;
      return isIrisGridPivotModel(target) === true
        ? pivotOverrides.mouseHandlers
        : [];
    },
  });

  Object.defineProperty(proxy, 'pivotConfig', {
    configurable: true,
    enumerable: true,
    get(): PivotConfig | null {
      return current;
    },
    set(config: PivotConfig | null): void {
      log.debug('set pivotConfig', config);
      if (deepEqual(current, config)) return;
      current = config;

      if (config == null) {
        proxy.setNextModel(Promise.resolve(proxy.originalModel));
        return;
      }

      const promise = (async (): Promise<IrisGridModel> => {
        log.info('Creating pivot with config:', config);
        const pspWidget = await getPspWidget();
        const pivotService =
          await corePlusDh.coreplus.pivot.PivotService.getInstance(pspWidget);
        const pivotTable = await pivotService.createPivotTable({
          source: table as unknown as CorePlusDhType.Table,
          rowKeys: config.rowKeys,
          columnKeys: config.columnKeys,
          aggregations: config.aggregations,
        });
        return new IrisGridPivotModel(corePlusDh, pivotTable);
      })();
      promise.catch(e => {
        log.error('createPivotTable failed for config', config, e);
      });

      proxy.setNextModel(promise);
    },
  });

  return proxy as unknown as PivotBuilderProxyModel;
}

/**
 * Spike-quality default config derived from the columns of the source
 * table. Picks the first non-numeric column as the row key, the second
 * non-numeric as the column key (if any), and aggregates all numeric
 * columns as `Sum`. Falls back to `Count` when no numeric columns exist.
 */
export function makeDefaultPivotConfig(
  columns: readonly DhType.Column[]
): PivotConfig {
  const numeric: string[] = [];
  const nonNumeric: string[] = [];
  for (const col of columns) {
    if (NUMERIC_TYPES.has(col.type)) {
      numeric.push(col.name);
    } else {
      nonNumeric.push(col.name);
    }
  }
  const rowKeys =
    nonNumeric.length > 0
      ? nonNumeric.slice(0, 1)
      : columns.length > 0
      ? [columns[0].name]
      : [];
  const columnKeys = nonNumeric.length > 1 ? nonNumeric.slice(1, 2) : [];
  const aggregations: Record<string, string[]> =
    numeric.length > 0 ? { Sum: numeric } : { Count: [] };
  return { rowKeys, columnKeys, aggregations };
}
