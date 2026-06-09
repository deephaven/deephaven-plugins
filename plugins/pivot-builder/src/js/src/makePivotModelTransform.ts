import Log from '@deephaven/log';
import { type IrisGridModel } from '@deephaven/iris-grid';
import { isCorePlusDh } from '@deephaven/js-plugin-pivot';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import {
  augmentPivotBuilderModel,
  type PivotBuilderConfig,
  type PivotBuilderProxyModel,
  type PivotOverrides,
} from './pivotBuilderModel';
import { type IrisGridModelTransform } from './modelTypes';

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
 * @param dh CorePlus-capable API.
 * @param getPspWidget Lazily fetches the PivotService widget on first apply.
 * @param pivotOverrides Renderer / mouse handlers / metric calculator routed
 *   through the proxy whenever its inner model is a pivot.
 * @param getPersistedConfig Reads the latest persisted builder config (or
 *   `null`). Read once per model build; restored synchronously before the
 *   model is published to avoid a hydration race.
 * @param upstream Optional upstream model transform to compose under.
 */
export function makePivotModelTransform(
  dh: typeof DhType | typeof CorePlusDhType,
  getPspWidget: () => Promise<DhType.Widget>,
  pivotOverrides: PivotOverrides,
  getPersistedConfig: () => PivotBuilderConfig | null = () => null,
  upstream?: IrisGridModelTransform
): IrisGridModelTransform {
  if (!isCorePlusDh(dh)) {
    throw new Error('CorePlus is not available; pivot builder requires DHE');
  }
  return async (model: IrisGridModel) => {
    const base = upstream != null ? await upstream(model) : model;
    log.info('Augmenting host model into pivot builder proxy');
    const augmented: PivotBuilderProxyModel = augmentPivotBuilderModel(
      dh,
      base,
      getPspWidget,
      pivotOverrides
    );
    // Hydrate persisted builder config synchronously *before* returning the
    // model. Doing this here (instead of via a post-mount effect) avoids a
    // race where a listener fires with the pre-hydration (empty) config and
    // overwrites the persisted value.
    const persisted = getPersistedConfig();
    if (persisted != null) {
      try {
        log.info('Restoring persisted builder config', persisted);
        augmented.applyPivotBuilderConfig(persisted);
      } catch (err) {
        log.warn('Failed to restore persisted builder config', err);
      }
    }
    return augmented;
  };
}

export default makePivotModelTransform;
