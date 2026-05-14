import type { dh } from '@deephaven/jsapi-types';
import JsBaseTableProxy, { type UITableLayoutHints } from './JsBaseTableProxy';

export type { UITableLayoutHints };

// This tricks TS into believing the class extends dh.Table
// Even though it is through a proxy
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface JsTableProxy extends dh.Table {}

/**
 * Class to proxy a `dh.Table`.
 *
 * The JsTable passed to the constructor may be modified, so it is recommended
 * to pass a copy. Shared proxy behavior lives in {@link JsBaseTableProxy};
 * this subclass exists to type the proxy as a `dh.Table`. Any methods not
 * implemented on the base class or this class are proxied to the underlying
 * table.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class JsTableProxy extends JsBaseTableProxy<
  dh.Table,
  dh.TableViewportSubscription
> {}

export default JsTableProxy;
