import type { dh } from '@deephaven/jsapi-types';
import {
  DATABAR_MIN_SUFFIX,
  DATABAR_MAX_SUFFIX,
  HEATMAP_MIN_SUFFIX,
  HEATMAP_MAX_SUFFIX,
} from './UITableUtils';

export interface UITableLayoutHints {
  frontColumns?: string[];
  frozenColumns?: string[];
  backColumns?: string[];
  hiddenColumns?: string[];
  columnGroups?: dh.ColumnGroup[];
}

/**
 * Subset of the dh.Table / dh.TreeTable surface area used by the proxy base
 * class. Both Table and TreeTable expose these members, so the base proxy can
 * operate on either.
 */
export interface ProxyableTable {
  readonly columns: dh.Column[];
  readonly customColumns: dh.CustomColumn[];
  readonly isClosed: boolean;
  applyCustomColumns: (
    customColumns: Array<string | dh.CustomColumn>
  ) => Array<dh.CustomColumn>;
  close: () => void;
  setViewport: (
    firstRow: number,
    lastRow: number,
    columns?: Array<dh.Column> | undefined | null,
    updateIntervalMs?: number | undefined | null
  ) => dh.TableViewportSubscription | void;
}

/**
 * Base class for proxying a JS API Table or TreeTable.
 *
 * The underlying table passed to the constructor may be modified, so callers
 * should pass a copy. Methods implemented on this class (or a subclass) take
 * precedence over the underlying table's methods; everything else is proxied
 * through to the table.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class JsBaseTableProxy<T extends ProxyableTable, R> {
  static HIDDEN_COLUMN_SUFFIXES = [
    DATABAR_MIN_SUFFIX,
    DATABAR_MAX_SUFFIX,
    HEATMAP_MIN_SUFFIX,
    HEATMAP_MAX_SUFFIX,
    '__FORMAT',
  ];

  protected table: T;

  /**
   * Keep a stable reference to all, visible, and hidden columns.
   * Only update when needed.
   */
  private stableColumns: {
    allColumns: dh.Column[];
    visibleColumns: dh.Column[];
    hiddenColumns: dh.Column[];
  };

  protected originalCustomColumns: dh.CustomColumn[];

  private onClose: () => void;

  layoutHints: dh.LayoutHints | null = null;

  constructor({
    table,
    layoutHints,
    onClose,
  }: {
    table: T;
    layoutHints: UITableLayoutHints;
    onClose: () => void;
  }) {
    this.table = table;
    this.originalCustomColumns = table.customColumns;
    this.onClose = onClose;

    this.stableColumns = {
      allColumns: [],
      visibleColumns: [],
      hiddenColumns: [],
    };

    const {
      frontColumns = null,
      frozenColumns = null,
      backColumns = null,
      hiddenColumns = null,
      columnGroups = null,
    } = layoutHints;

    this.layoutHints = {
      frontColumns,
      frozenColumns,
      backColumns,
      hiddenColumns,
      columnGroups,
      areSavedLayoutsAllowed: false,
    };

    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, {
      // We want to use any properties on the proxy model if defined
      // If not, then proxy to the underlying model
      get(target, prop, receiver) {
        // Walk the prototype chain so getters defined on subclasses or this
        // base class are found.
        let proto = Object.getPrototypeOf(target);
        while (proto != null && proto !== Object.prototype) {
          const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
          if (descriptor?.get != null) {
            return Reflect.get(target, prop, receiver);
          }
          if (descriptor != null && typeof descriptor.value === 'function') {
            return descriptor.value.bind(target);
          }
          proto = Object.getPrototypeOf(proto);
        }

        // Does this instance implement the property
        if (Object.prototype.hasOwnProperty.call(target, prop)) {
          return Reflect.get(target, prop, receiver);
        }

        const value = Reflect.get(target.table, prop, receiver);
        if (typeof value === 'function') {
          return value.bind(target.table);
        }
        return value;
      },
      set(target, prop, value) {
        // Walk the prototype chain looking for a setter.
        let proto = Object.getPrototypeOf(target);
        while (proto != null && proto !== Object.prototype) {
          const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
          if (descriptor?.set != null) {
            return Reflect.set(target, prop, value);
          }
          proto = Object.getPrototypeOf(proto);
        }

        if (Object.prototype.hasOwnProperty.call(target, prop)) {
          return Reflect.set(target, prop, value);
        }

        return Reflect.set(target.table, prop, value, target.table);
      },
    });
  }

  /**
   * Update the stable columns object if needed.
   * This lets us keep a stable array for columns unless the underlying table changes.
   */
  private updateDisplayedColumns(): void {
    if (this.stableColumns.allColumns !== this.table.columns) {
      this.stableColumns.allColumns = this.table.columns;

      this.stableColumns.visibleColumns = this.table.columns.filter(
        column =>
          !JsBaseTableProxy.HIDDEN_COLUMN_SUFFIXES.some(suffix =>
            column.name.endsWith(suffix)
          )
      );

      this.stableColumns.hiddenColumns = this.table.columns.filter(column =>
        JsBaseTableProxy.HIDDEN_COLUMN_SUFFIXES.some(suffix =>
          column.name.endsWith(suffix)
        )
      );
    }
  }

  close(): void {
    // Something causes close to get called twice which will throw some log spam if we try to close the table again
    if (!this.table.isClosed) {
      this.onClose();
      this.table.close();
    }
  }

  applyCustomColumns(
    customColumns: Array<string | dh.CustomColumn>
  ): Array<dh.CustomColumn> {
    return this.table.applyCustomColumns([
      ...this.originalCustomColumns,
      ...customColumns,
    ]);
  }

  get columns(): dh.Column[] {
    this.updateDisplayedColumns();
    return this.stableColumns.visibleColumns;
  }

  get hiddenColumns(): dh.Column[] {
    this.updateDisplayedColumns();
    return this.stableColumns.hiddenColumns;
  }

  setViewport(
    firstRow: number,
    lastRow: number,
    columns?: Array<dh.Column> | undefined | null,
    updateIntervalMs?: number | undefined | null
  ): R {
    if (columns == null) {
      return this.table.setViewport(
        firstRow,
        lastRow,
        columns,
        updateIntervalMs
      ) as unknown as R;
    }

    const allColumns = columns.concat(this.hiddenColumns);
    const viewportSubscription = this.table.setViewport(
      firstRow,
      lastRow,
      allColumns,
      updateIntervalMs
    );
    // TreeTable.setViewport returns void; avoid wrapping undefined in a Proxy
    if (viewportSubscription == null) {
      return viewportSubscription as unknown as R;
    }
    return new Proxy(viewportSubscription, {
      get: (target, prop, receiver) => {
        // Need to proxy setViewport on the subscription in case it is changed
        // without creating an entirely new subscription
        if (prop === 'setViewport') {
          return (
            first: number,
            last: number,
            cols?: dh.Column[] | null,
            interval?: number | null
          ) => {
            if (cols == null) {
              return target.setViewport(first, last, cols, interval);
            }

            const proxyAllColumns = cols.concat(this.hiddenColumns);

            return target.setViewport(first, last, proxyAllColumns, interval);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as unknown as R;
  }
}

export default JsBaseTableProxy;
