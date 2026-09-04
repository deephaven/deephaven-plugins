import Log from '@deephaven/log';
import {
  type IrisGridModel,
  type IrisGridModelTransform,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { isCorePlusDh } from '@deephaven/js-plugin-pivot';
import {
  augmentPivotBuilderModel,
  type PivotBuilderConfig,
  type PivotBuilderProxyModel,
} from './pivotBuilderModel';

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
 * @param getPersistedConfig Reads the latest persisted builder config (or
 *   `null`). Read once per model build; restored synchronously before the
 *   model is published to avoid a hydration race.
 * @param upstream Optional upstream model transform to compose under.
 */
export function makePivotModelTransform(
  dh: typeof DhType | typeof CorePlusDhType,
  getPersistedConfig: () => PivotBuilderConfig | null = () => null,
  upstream?: IrisGridModelTransform
): IrisGridModelTransform {
  // CorePlus is NOT required here: the augmented proxy supports rollup and
  // aggregate (totals) on any worker (operating on the source table), and the
  // CorePlus-only pivot path is gated separately (CorePlus availability + the
  // guard in `augmentPivotBuilderModel`'s `applyPivotConfig`). So always build
  // the proxy; Legacy tables get working rollup/aggregate with the Pivot card
  // disabled.
  return async (model: IrisGridModel) => {
    const base = upstream != null ? await upstream(model) : model;
    log.info('Augmenting host model into pivot builder proxy');
    const augmented: PivotBuilderProxyModel = augmentPivotBuilderModel(
      dh,
      base
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
      // Pivot is available only on CorePlus workers; thread that through so the
      // model's re-derivation of `persisted.ui` agrees on the mode (a persisted
      // pivot on a non-CorePlus worker derives down to rollup/totals). A
      // failure to *apply* the persisted config is tolerated: log it and still
      // return the augmented model so the panel renders (rollup/totals may have
      // applied, and the user can re-apply) rather than erroring the whole
      // model build.
      const pivotAvailable = isCorePlusDh(dh);
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
