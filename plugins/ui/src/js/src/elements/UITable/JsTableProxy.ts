import type { dh } from '@deephaven/jsapi-types';

export interface UITableLayoutHints {
  frontColumns?: readonly string[];
  frozenColumns?: readonly string[];
  backColumns?: readonly string[];
  hiddenColumns?: readonly string[];
  columnGroups?: readonly dh.ColumnGroup[];
}

// This tricks TS into believing the class extends dh.Table
// Even though it is through a proxy
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface JsTableProxy extends dh.Table {}

/**
 * Class to proxy JsTable.
 * The JsTable passed to the constructor may be modified, so it is recommended to pass a copy.
 * Any methods implemented in this class will be utilized over the underlying JsTable methods.
 * Any methods not implemented in this class will be proxied to the table.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class JsTableProxy implements dh.Table {
  static HIDDEN_COLUMN_SUFFIXES = [
    '__DATABAR_Min',
    '__DATABAR_Max',
    '__FORMAT',
  ];

  private table: dh.Table;

  /**
   * Keep a stable reference to all, visible, and hidden columns.
   * Only update when needed.
   */
  private stableColumns: {
    allColumns: dh.Column[];
    visibleColumns: dh.Column[];
    hiddenColumns: dh.Column[];
  };

  private originalCustomColumns: dh.CustomColumn[];

  private onClose: () => void;

  layoutHints: dh.LayoutHints | null = null;

  constructor({
    table,
    layoutHints,
    onClose,
  }: {
    table: dh.Table;
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
    } as dh.LayoutHints;

    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, {
      // We want to use any properties on the proxy model if defined
      // If not, then proxy to the underlying model
      get(target, prop, receiver) {
        // Does this class have a getter for the prop
        // Getter functions are on the prototype
        const proxyHasGetter =
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop)
            ?.get != null;

        if (proxyHasGetter) {
          return Reflect.get(target, prop, receiver);
        }

        // Does this class implement the property
        const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);

        // Does the class implement a function for the property
        const proxyHasFn = Object.prototype.hasOwnProperty.call(
          Object.getPrototypeOf(target),
          prop
        );

        const trueTarget = proxyHasProp || proxyHasFn ? target : target.table;
        const value = Reflect.get(trueTarget, prop, receiver);

        if (typeof value === 'function') {
          return value.bind(trueTarget);
        }

        return value;
      },
      set(target, prop, value) {
        const proxyHasSetter =
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop)
            ?.set != null;

        const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);

        if (proxyHasSetter || proxyHasProp) {
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
          !JsTableProxy.HIDDEN_COLUMN_SUFFIXES.some(suffix =>
            column.name.endsWith(suffix)
          )
      );

      this.stableColumns.hiddenColumns = this.table.columns.filter(column =>
        JsTableProxy.HIDDEN_COLUMN_SUFFIXES.some(suffix =>
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
  ): dh.TableViewportSubscription {
    if (columns == null) {
      return this.table.setViewport(
        firstRow,
        lastRow,
        columns,
        updateIntervalMs
      );
    }

    const allColumns = columns.concat(this.hiddenColumns);
    const viewportSubscription = this.table.setViewport(
      firstRow,
      lastRow,
      allColumns,
      updateIntervalMs
    );
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
    });
  }
}

export default JsTableProxy;
