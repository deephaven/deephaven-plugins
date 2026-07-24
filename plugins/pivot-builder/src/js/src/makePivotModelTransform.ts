import Log from '@deephaven/log';
import {
  type IrisGridModel,
  type IrisGridModelTransform,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import {
  augmentPivotBuilderModel,
  type PivotBuilderConfig,
  type PivotBuilderProxyModel,
} from './pivotBuilderModel';
import { resolveEffectiveBuilderConfig } from './resolveEffectiveBuilderConfig';

const log = Log.module(
  '@deephaven/js-plugin-pivot-builder/makePivotModelTransform'
);

/**
 * Build an {@link IrisGridModelTransform} that augments the host-built
 * `IrisGridProxyModel` into a pivot-builder proxy (see
 * {@link augmentPivotBuilderModel}) and, optionally, hydrates a persisted
 * builder config before the model is published.
 *
 * Designed to be referentially stable: pass `getPersistedConfig` as a
 * stable function (e.g. a ref reader) so the latest persisted value is read
 * at model-build time without the transform's identity changing whenever
 * the persisted config changes (which would rebuild the model).
 *
 * Composes on top of any `upstream` transform threaded down the middleware
 * chain, so the host-built model is first passed through the upstream
 * transform and then augmented here.
 *
 * @param dh The JS API (Core, Core+ or Legacy). CorePlus is required only for
 *   the pivot path, which is gated separately; rollup/aggregate work on any.
 * @param getPspWidget Lazily fetches the PivotService widget on first apply.
 * @param getPersistedConfig Reads the latest persisted builder config (or
 *   `null`). Read once per model build; restored synchronously before the
 *   model is published to avoid a hydration race.
 * @param upstream Optional upstream model transform to compose under.
 * @param resetPspWidget Invalidates any cached PivotService widget. Called at
 *   the start of every model *re-build* (e.g. after a query restart) so the
 *   pivot is built against a freshly fetched widget bound to the new worker
 *   rather than a stale widget from the dead one (which would hang the build
 *   and leave the panel spinning forever). Skipped on the first build, where
 *   the cache is already fresh.
 */
export function makePivotModelTransform(
  dh: typeof DhType | typeof CorePlusDhType,
  getPspWidget: () => Promise<DhType.Widget>,
  getPersistedConfig: () => PivotBuilderConfig | null = () => null,
  upstream?: IrisGridModelTransform,
  resetPspWidget?: () => void
): IrisGridModelTransform {
  // CorePlus is NOT required here: the augmented proxy supports rollup and
  // aggregate (totals) on any worker (operating on the source table), and the
  // CorePlus-only pivot path is gated separately (PSP availability probe + the
  // guard in `augmentPivotBuilderModel`'s `applyPivotConfig`). So always build
  // the proxy; Legacy tables get working rollup/aggregate with the Pivot card
  // disabled.
  // The host rebuilds the model (and re-runs this transform) when its
  // `makeModel` prop changes — which happens on a worker/query restart while
  // the middleware component stays mounted. On those rebuilds any
  // widget cached by the middleware belongs to the now-dead worker, so we
  // drop it before building. The first invocation needs no reset (nothing is
  // cached yet, or the eager availability probe just populated it).
  let hasBuilt = false;
  return async (model: IrisGridModel) => {
    if (hasBuilt) {
      resetPspWidget?.();
    }
    hasBuilt = true;
    const base = upstream != null ? await upstream(model) : model;
    log.info('Augmenting host model into pivot builder proxy');
    const augmented: PivotBuilderProxyModel = augmentPivotBuilderModel(
      dh,
      base,
      getPspWidget
    );
    // Hydrate persisted builder config synchronously *before* returning the
    // model. Doing this here (instead of via a post-mount effect) avoids a
    // race where a listener fires with the pre-hydration (empty) config and
    // overwrites the persisted value.
    //
    // We also *await* the resulting inner-model swap before returning. The
    // pivot/rollup build is routed through the host proxy's async
    // `setNextModel`, so without this await the host would run
    // `hydrateIrisGridState` while the inner model is still the flat source —
    // pushing the persisted sort/filter onto the wrong model and losing them
    // once the pivot/rollup swaps in (the host does not re-push onto the
    // in-place proxy). Awaiting ensures the host hydrates against the derived
    // model's columns.
    const persisted = getPersistedConfig();
    if (persisted != null) {
      // Whether restoring this config would render a *pivot*. Modern configs
      // carry raw card state (`ui`) and are re-derived against the CURRENT live
      // schema (via the same `resolveEffectiveBuilderConfig` the model uses), so
      // the persisted `pivot`/`rollup`/`totals` are NOT trusted verbatim to
      // decide this — we ask the derivation. `pivotAvailable: true` here means
      // "if the ui implies a pivot, we intend to build one" (so probe); the
      // real availability is confirmed by the probe below. Both flags are
      // monotone gates in the derivation, so a missed-probe/silent-downgrade
      // combination is impossible; the trade-off runs the other way — a ui
      // implying pivot probes (fatally, if PSP is gone) even when the model's
      // own derivation might pick rollup via a false `rollupAvailable`.
      // Legacy configs (no `ui`) fall back to the persisted `pivot` field.
      const columns = augmented.sourceTable.columns;
      const wouldPivot =
        persisted.ui != null
          ? resolveEffectiveBuilderConfig(persisted.ui, columns, {
              pivotAvailable: true,
              rollupAvailable: true,
            }).pivot != null
          : persisted.pivot != null;

      // A persisted *pivot* view can only be rebuilt if the worker still has
      // the PivotService. Probe it up-front and let any failure propagate out
      // of the transform: a query edited to remove the pivot service (then
      // restarted) must fail the model build loudly so the host renders an
      // error panel, rather than silently swallowing the failed pivot swap and
      // dropping back to the flat source table. `getPspWidget` caches its
      // result, so the subsequent `applyPivotBuilderConfig` reuses this widget
      // without re-fetching. Rollup/totals-only views build off the source
      // table directly and need no probe.
      let pivotAvailable = false;
      if (wouldPivot) {
        await getPspWidget();
        // A failed probe throws above and never reaches here, so a successful
        // probe means PSP is available for this build.
        pivotAvailable = true;
      }
      // Unlike the PSP probe above (intentionally fatal), a failure to *apply*
      // the persisted config is tolerated: log it and still return the
      // augmented model so the panel renders (rollup/totals may have applied,
      // and the user can re-apply) rather than erroring the whole model build.
      // Pass the probe result so the model's re-derivation of `persisted.ui`
      // agrees on the mode. When no probe ran (`wouldPivot` false) a `false`
      // value is only consulted if the derivation would pick a pivot — which by
      // construction it won't.
      try {
        log.info('Restoring persisted builder config', persisted);
        await augmented.applyPivotBuilderConfig(persisted, { pivotAvailable });
      } catch (err) {
        log.warn('Failed to restore persisted builder config', err);
      }
    }
    return augmented;
  };
}

export default makePivotModelTransform;
