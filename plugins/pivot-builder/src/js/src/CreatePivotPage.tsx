import { useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '@deephaven/components';
import { type IrisGridTableOptionsPageProps } from '@deephaven/iris-grid';
import { useApi, useObjectFetch } from '@deephaven/jsapi-bootstrap';
import { IrisGridPivotModel, isCorePlusDh } from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import PivotBuilderIrisGridModel, {
  isPivotBuilderIrisGridModel,
} from './PivotBuilderIrisGridModel';
import { PivotBuilderPanelContext } from './PivotBuilderPanelContext';

const log = Log.module('@deephaven/js-plugin-pivot-builder/CreatePivotPage');

/**
 * Returns `true` when `model` quacks like the host
 * `IrisGridProxyModel` (it owns a swappable inner model via `setNextModel`
 * and exposes the current `table`). We avoid an `instanceof` check so the
 * plugin doesn't pin its build to a specific iris-grid copy.
 */
function isSwappableProxy(model: unknown): model is {
  setNextModel(promise: Promise<unknown>): void;
  table?: DhType.Table;
  model?: { table?: DhType.Table };
} {
  return (
    typeof model === 'object' &&
    model !== null &&
    typeof (model as { setNextModel?: unknown }).setNextModel === 'function'
  );
}

function getProxyTable(model: unknown): DhType.Table | null {
  if (!isSwappableProxy(model)) return null;
  // IrisGridProxyModel forwards `table` to the inner IrisGridTableModel.
  const t = model.table ?? model.model?.table;
  return t ?? null;
}

/**
 * Sidebar `configPage` for the Create Pivot menu item.
 *
 * Two paths:
 *  - **Non-panel widget path**: the active model is a
 *    `PivotBuilderIrisGridModel`; we just write a default `pivotConfig`.
 *  - **Panel path**: the active model is the host `IrisGridProxyModel`;
 *    we build the pivot ourselves and hand it to `setNextModel`.
 */
export function CreatePivotPage({
  model,
  onBack,
}: IrisGridTableOptionsPageProps): JSX.Element {
  const dh = useApi();
  const panelContext = useContext(PivotBuilderPanelContext);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isProxy = isPivotBuilderIrisGridModel(model);
  const hasPivot = isProxy && model.pivotConfig != null;
  const swappableProxy = isSwappableProxy(model) ? model : null;
  const panelPathReady =
    !isProxy &&
    swappableProxy != null &&
    isCorePlusDh(dh) &&
    panelContext?.metadata != null;

  // Subscribe to the well-known `psp` PivotService when in panel mode.
  const pspDescriptor = useMemo<DhType.ide.VariableDescriptor>(() => {
    if (!panelPathReady || panelContext?.metadata == null) {
      return { type: 'PivotService', name: '__unavailable__' };
    }
    return { ...panelContext.metadata, type: 'PivotService', name: 'psp' };
  }, [panelPathReady, panelContext]);
  const pspFetch = useObjectFetch<DhType.Widget>(pspDescriptor);

  const canCreate =
    isProxy ||
    (panelPathReady &&
      (pspFetch.status === 'ready' || pspFetch.status === 'loading'));

  const handleCreate = useCallback(async () => {
    setError(null);
    if (isPivotBuilderIrisGridModel(model)) {
      try {
        const defaults = PivotBuilderIrisGridModel.makeDefaultPivotConfig(
          model.columns
        );
        log.info('Applying default pivot config (widget path)', defaults);
        model.pivotConfig = defaults;
        onBack();
      } catch (e) {
        log.error('Failed to apply pivot config', e);
        setError(e instanceof Error ? e.message : String(e));
      }
      return;
    }

    if (swappableProxy == null || !isCorePlusDh(dh)) {
      setError('Create Pivot requires the CorePlus JS API.');
      return;
    }
    const table = getProxyTable(model);
    if (table == null) {
      setError('Active model has no underlying table.');
      return;
    }
    if (pspFetch.status !== 'ready') {
      setError('PivotService is not ready yet — try again in a moment.');
      return;
    }

    setBusy(true);
    try {
      const pspWidget = (await pspFetch.fetch()) as CorePlusDhType.Widget;
      const config = PivotBuilderIrisGridModel.makeDefaultPivotConfig(
        model.columns
      );
      log.info('Building pivot via panel path', config);
      const pivotService = await (
        dh as unknown as typeof CorePlusDhType
      ).coreplus.pivot.PivotService.getInstance(pspWidget);
      const pivotTable = await pivotService.createPivotTable({
        source: table as unknown as CorePlusDhType.Table,
        rowKeys: config.rowKeys,
        columnKeys: config.columnKeys,
        aggregations: config.aggregations,
      });
      const pivotModel = new IrisGridPivotModel(
        dh as unknown as typeof CorePlusDhType,
        pivotTable
      );
      swappableProxy.setNextModel(Promise.resolve(pivotModel));
      onBack();
    } catch (e) {
      log.error('Failed to build pivot (panel path)', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [model, swappableProxy, dh, pspFetch, onBack]);

  const handleReset = useCallback(() => {
    if (!isPivotBuilderIrisGridModel(model)) return;
    log.info('Reverting to flat table model');
    model.pivotConfig = null;
    setError(null);
  }, [model]);

  return (
    <div className="iris-grid-plugin-sidebar-page" style={{ padding: 12 }}>
      <h5>Create Pivot</h5>
      <p>
        Build a pivot view of this table using sensible defaults. The first
        non-numeric column becomes the row key, the second non-numeric column
        (if any) becomes the column key, and all numeric columns are summed.
      </p>
      {error != null && (
        <p role="alert" style={{ color: 'var(--dh-color-red, #c43d3d)' }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button kind="secondary" onClick={onBack}>
          Back
        </Button>
        <Button
          kind="primary"
          onClick={handleCreate}
          disabled={!canCreate || busy}
        >
          {busy ? 'Creating…' : 'Create Pivot'}
        </Button>
        {hasPivot && (
          <Button kind="danger" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

export default CreatePivotPage;
