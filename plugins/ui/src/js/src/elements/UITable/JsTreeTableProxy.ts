import type { dh } from '@deephaven/jsapi-types';
import JsBaseTableProxy, { type UITableLayoutHints } from './JsBaseTableProxy';

export type { UITableLayoutHints };

// This tricks TS into believing the class extends dh.TreeTable
// Even though it is through a proxy
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface JsTreeTableProxy extends dh.TreeTable {}

/**
 * Class to proxy a `dh.TreeTable` (including rollup tables).
 *
 * The TreeTable passed to the constructor may be modified, so it is
 * recommended to pass a copy. Shared proxy behavior lives in
 * {@link JsBaseTableProxy}; this subclass exists to type the proxy as a
 * `dh.TreeTable`. Any methods not implemented on the base class or this class
 * are proxied to the underlying tree table.
 *
 * Note: TreeTable does NOT support `naturalJoin()` or `getTotalsTable()`, and
 * `applyCustomColumns()` on a rollup adds the column to the source rather
 * than the aggregated output. Callers must avoid using formatting features
 * that depend on those operations (e.g. databars/heatmaps with auto min/max,
 * or conditional `if_` rules).
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class JsTreeTableProxy extends JsBaseTableProxy<dh.TreeTable, void> {}

export default JsTreeTableProxy;
