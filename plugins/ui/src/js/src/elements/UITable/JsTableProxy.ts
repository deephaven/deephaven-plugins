import type { dh } from '@deephaven/jsapi-types';

export interface UITableLayoutHints {
  frontColumns?: string[];
  frozenColumns?: string[];
  backColumns?: string[];
  hiddenColumns?: string[];
  columnGroups?: dh.ColumnGroup[];
}

// This tricks TS into believing the class extends dh.Table
// Even though it is through a proxy
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface JsTableProxy extends dh.Table {}

/**
 * Class to proxy JsTable.
 * Any methods implemented in this class will be utilized over the underlying JsTable methods.
 * Any methods not implemented in this class will be proxied to the table.
 */
class JsTableProxy {
  private table: dh.Table;

  layoutHints: dh.LayoutHints | null = null;

  constructor({
    table,
    layoutHints,
  }: {
    table: dh.Table;
    layoutHints: UITableLayoutHints;
  }) {
    this.table = table;

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

        if (proxyHasSetter) {
          return Reflect.set(target, prop, value, target);
        }

        return Reflect.set(target.table, prop, value, target.table);
      },
    });
  }
}

export default JsTableProxy;
