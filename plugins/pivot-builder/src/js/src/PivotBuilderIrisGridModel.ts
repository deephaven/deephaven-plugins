import deepEqual from 'fast-deep-equal';
import { IrisGridModel, IrisGridTableModel } from '@deephaven/iris-grid';
import { Formatter } from '@deephaven/jsapi-utils';
import { IrisGridPivotModel, isCorePlusDh } from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';
import {
  type CancelablePromise,
  EventShimCustomEvent,
  PromiseUtils,
} from '@deephaven/utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderIrisGridModel'
);

/**
 * Numeric column type check, copied from the reference `grid-toolbar` plugin
 * (`usePivotToggle.ts`).
 */
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
 * Proxy `IrisGridModel` that can swap its inner model between the original
 * `IrisGridTableModel` (flat) and an `IrisGridPivotModel` (pivot view).
 *
 * Mirrors `IrisGridProxyModel` from web-client-ui — uses the JS `Proxy`
 * constructor trick so that any property/method this class does not
 * implement is forwarded to the current inner model.
 */
class PivotBuilderIrisGridModel extends IrisGridModel {
  /** Source flat table; needed to build the pivot. */
  private originalTable: DhType.Table;

  /** PivotService widget fetched from the same query (commonly `psp`). */
  private pspWidget: DhType.Widget;

  /** Inner model for the flat view. Kept alive across pivot swaps. */
  private originalModel: IrisGridModel;

  /** Currently active inner model (either `originalModel` or a pivot model). */
  model: IrisGridModel;

  private pivot: PivotConfig | null;

  private irisFormatter: Formatter;

  private modelPromise: CancelablePromise<IrisGridModel> | null;

  // Re-typed to the CorePlus API for pivot calls. The base class field is
  // `typeof DhType` — narrowing here keeps consumers happy.
  declare dh: typeof CorePlusDhType;

  constructor(
    dh: typeof DhType | typeof CorePlusDhType,
    originalTable: DhType.Table,
    pspWidget: DhType.Widget,
    formatter = new Formatter(dh)
  ) {
    if (!isCorePlusDh(dh)) {
      throw new Error('CorePlus is not available; pivot builder requires DHE');
    }

    super(dh);

    // EventTarget methods must be bound; the Proxy below would otherwise
    // throw on `this` binding for these.
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);
    this.handleModelEvent = this.handleModelEvent.bind(this);

    this.dh = dh;
    this.originalTable = originalTable;
    this.pspWidget = pspWidget;
    this.irisFormatter = formatter;
    this.pivot = null;
    this.modelPromise = null;

    const inner = new IrisGridTableModel(dh, originalTable, formatter);
    this.originalModel = inner;
    this.model = inner;

    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, {
      get(target, prop, receiver) {
        const proto = Object.getPrototypeOf(target);
        const proxyHasGetter =
          Object.getOwnPropertyDescriptor(proto, prop)?.get != null;
        if (proxyHasGetter) {
          return Reflect.get(target, prop, receiver);
        }
        const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);
        const proxyHasFn = Object.prototype.hasOwnProperty.call(proto, prop);
        if (proxyHasProp || proxyHasFn) {
          return Reflect.get(target, prop, receiver);
        }
        // Delegate everything else to the current inner model.
        const inner = target.model as unknown as Record<PropertyKey, unknown>;
        const value = inner[prop];
        if (typeof value === 'function') {
          return (value as (...args: unknown[]) => unknown).bind(target.model);
        }
        return value;
      },
      set(target, prop, value, receiver) {
        const proto = Object.getPrototypeOf(target);
        const proxyHasSetter =
          Object.getOwnPropertyDescriptor(proto, prop)?.set != null;
        if (proxyHasSetter) {
          return Reflect.set(target, prop, value, receiver);
        }
        const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);
        if (proxyHasProp) {
          return Reflect.set(target, prop, value, receiver);
        }
        // Delegate to the current inner model.
        const inner = target.model as unknown as Record<PropertyKey, unknown>;
        inner[prop] = value;
        return true;
      },
    });
  }

  // --- pivotConfig ----------------------------------------------------

  get pivotConfig(): PivotConfig | null {
    return this.pivot;
  }

  set pivotConfig(config: PivotConfig | null) {
    log.debug('set pivotConfig', config);

    if (deepEqual(config, this.pivot)) {
      return;
    }
    this.pivot = config;

    if (config == null) {
      // Revert to the original flat-table model.
      this.setNextModel(Promise.resolve(this.originalModel));
      return;
    }

    const modelPromise = this.buildPivotModel(config);
    this.setNextModel(modelPromise);
  }

  /**
   * Build a pivot via `PivotService.createPivotTable` and wrap the resulting
   * pivot table in an `IrisGridPivotModel`.
   */
  private async buildPivotModel(config: PivotConfig): Promise<IrisGridModel> {
    log.info('Creating pivot with config:', config);

    const pivotService = await this.dh.coreplus.pivot.PivotService.getInstance(
      this.pspWidget
    );
    const pivotTable = await pivotService.createPivotTable({
      source: this.originalTable,
      rowKeys: config.rowKeys,
      columnKeys: config.columnKeys,
      aggregations: config.aggregations,
    });
    return new IrisGridPivotModel(this.dh, pivotTable);
  }

  // --- model swap (mirrors IrisGridProxyModel.setNextModel/setModel) --

  private setModel(model: IrisGridModel): void {
    log.debug('setModel', model);
    const oldModel = this.model;
    if (oldModel !== this.originalModel && oldModel !== model) {
      oldModel.close();
    }
    this.model = model;
    if (this.listenerCount > 0) {
      this.addListeners(model);
    }
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: model.columns,
      })
    );
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED, { detail: null })
    );
  }

  private setNextModel(modelPromise: Promise<IrisGridModel>): void {
    log.debug2('setNextModel');
    if (this.modelPromise) {
      this.modelPromise.cancel();
    }
    if (this.listenerCount > 0) {
      this.removeListeners(this.model);
    }
    this.modelPromise = PromiseUtils.makeCancelable(
      modelPromise,
      (model: IrisGridModel) => {
        if (model !== this.originalModel) {
          model.close();
        }
      }
    );
    this.modelPromise
      .then(model => {
        this.modelPromise = null;
        this.setModel(model);
      })
      .catch((err: unknown) => {
        if (PromiseUtils.isCanceled(err)) {
          log.debug2('setNextModel cancelled');
          return;
        }
        log.error('Unable to build pivot model', err);
        this.modelPromise = null;
        // Drop back to the original model so the UI stays usable.
        this.pivot = null;
        this.setModel(this.originalModel);
        this.dispatchEvent(
          new EventShimCustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, {
            detail: err,
          })
        );
      });
  }

  // --- event forwarding ----------------------------------------------

  private handleModelEvent(event: CustomEvent): void {
    const { detail, type } = event;
    this.dispatchEvent(new EventShimCustomEvent(type, { detail }));
  }

  startListening(): void {
    super.startListening();
    this.addListeners(this.model);
  }

  stopListening(): void {
    super.stopListening();
    this.removeListeners(this.model);
  }

  private addListeners(model: IrisGridModel): void {
    const events = Object.keys(IrisGridModel.EVENT);
    for (let i = 0; i < events.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore -- iterating the readonly EVENT map
      model.addEventListener(events[i], this.handleModelEvent);
    }
  }

  private removeListeners(model: IrisGridModel): void {
    const events = Object.keys(IrisGridModel.EVENT);
    for (let i = 0; i < events.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore -- iterating the readonly EVENT map
      model.removeEventListener(events[i], this.handleModelEvent);
    }
  }

  // --- formatter / cleanup -------------------------------------------

  get formatter(): Formatter {
    return this.irisFormatter;
  }

  set formatter(formatter: Formatter) {
    this.irisFormatter = formatter;
    // Forward to inner model so cell formatting stays consistent.
    (this.model as unknown as { formatter: Formatter }).formatter = formatter;
  }

  close(): void {
    log.debug('close');
    if (this.modelPromise) {
      this.modelPromise.cancel();
      this.modelPromise = null;
    }
    // Close the current model if it's a pivot we created.
    if (this.model !== this.originalModel) {
      this.model.close();
    }
    this.originalModel.close();
  }

  // --- defaults helper -----------------------------------------------

  /**
   * Spike-quality default config derived from the columns of the source
   * table. Picks the first non-numeric column as the row key, the second
   * non-numeric as the column key (if any), and aggregates all numeric
   * columns as `Sum`. Falls back to `Count` when no numeric columns exist.
   */
  static makeDefaultPivotConfig(
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
}

export function isPivotBuilderIrisGridModel(
  model: unknown
): model is PivotBuilderIrisGridModel {
  return model instanceof PivotBuilderIrisGridModel;
}

export default PivotBuilderIrisGridModel;
