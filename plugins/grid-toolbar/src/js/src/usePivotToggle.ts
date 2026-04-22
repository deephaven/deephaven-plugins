import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { type dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { type IrisGridModel } from '@deephaven/iris-grid';
import { useObjectFetch } from '@deephaven/jsapi-bootstrap';
import { IrisGridPivotModel, isCorePlusDh } from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-grid-toolbar/usePivotToggle');

const NUMERIC_TYPES = new Set([
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

export interface PivotToggleResult {
  /** Whether CorePlus pivot API is available */
  isAvailable: boolean;
  /** The IrisGridModel for the pivot table, or null if not in pivot view */
  pivotModel: IrisGridModel | null;
  /** Whether pivot creation is in progress */
  isBuilding: boolean;
  /** Toggle between grid and pivot views */
  handleToggle: () => void;
}

/**
 * Hook to toggle between grid and pivot views.
 * Creates a PivotTable from the fetched table using PivotService with auto-detected defaults.
 */
export function usePivotToggle(
  dh: typeof DhType | typeof CorePlusDhType,
  fetch: () => Promise<unknown>,
  isPivotView: boolean,
  setView: (view: 'grid' | 'pivot') => void,
  metadata?: DhType.ide.VariableDescriptor
): PivotToggleResult {
  const [pivotModel, setPivotModel] = useState<IrisGridModel | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  // Build a descriptor for the PivotService variable on the same query.
  // The convention is that PivotServicePlugin is exported as 'psp'.
  // We copy querySerial from the table's metadata so the ObjectFetchManager
  // routes to the same query/worker.
  const pspDescriptor = useMemo(() => {
    if (!isCorePlusDh(dh) || metadata == null) {
      return { type: 'PivotService', name: '__unavailable__' };
    }
    return {
      ...metadata,
      type: 'PivotService',
      name: 'psp',
    };
  }, [dh, metadata]);

  const pspFetch = useObjectFetch(pspDescriptor);

  const isAvailable = isCorePlusDh(dh) && pspFetch.status === 'ready';

  useEffect(() => {
    if (pspFetch.status === 'error') {
      log.debug('PivotService (psp) not available on this query');
    }
    if (pspFetch.status === 'ready') {
      log.info('PivotService (psp) is available on this query');
    }
  }, [pspFetch.status]);

  // Track the current model ref for cleanup
  const pivotModelRef = useRef<IrisGridModel | null>(null);

  useEffect(() => {
    pivotModelRef.current = pivotModel;
  }, [pivotModel]);

  // Cleanup pivot model on unmount
  useEffect(
    () => () => {
      pivotModelRef.current?.close();
    },
    []
  );

  const handleToggle = useCallback(async () => {
    if (isPivotView) {
      // Switch back to grid
      pivotModel?.close();
      setPivotModel(null);
      setView('grid');
      return;
    }

    if (!isCorePlusDh(dh)) {
      log.error('CorePlus API not available; cannot create pivot');
      return;
    }

    if (pspFetch.status !== 'ready') {
      log.error('PivotService (psp) not available');
      return;
    }

    setIsBuilding(true);
    try {
      // Fetch the source table and the PivotService widget in parallel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [table, pspWidget] = (await Promise.all([
        fetch(),
        pspFetch.fetch(),
      ])) as [any, any];

      if (table?.columns == null) {
        log.warn('Fetched object has no columns; cannot build pivot');
        return;
      }

      // Auto-detect column categories
      const numericColumns: string[] = [];
      const nonNumericColumns: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      table.columns.forEach((col: any) => {
        if (NUMERIC_TYPES.has(col.type)) {
          numericColumns.push(col.name);
        } else {
          nonNumericColumns.push(col.name);
        }
      });

      if (nonNumericColumns.length === 0) {
        log.warn('Table has no non-numeric columns for row/column keys');
        return;
      }

      // Split non-numeric columns: first goes to rows, rest to columns
      const rowKeys = nonNumericColumns.slice(0, 1);
      const columnKeys =
        nonNumericColumns.length > 1 ? nonNumericColumns.slice(1, 2) : [];

      // Use all numeric columns as values with Sum aggregation
      // If no numeric columns, use Count on the first non-numeric column
      const aggregations: Record<string, string[]> =
        numericColumns.length > 0
          ? { Sum: numericColumns }
          : { Count: [nonNumericColumns[0]] };

      const config = {
        source: table,
        rowKeys,
        columnKeys,
        aggregations,
      };

      log.info('Creating pivot with config:', config);

      // Get PivotService from the psp widget, then create PivotTable
      const corePlusDh = dh as typeof CorePlusDhType;
      const pivotService =
        await corePlusDh.coreplus.pivot.PivotService.getInstance(pspWidget);
      log.info('PivotService obtained:', pivotService);
      const pivotTable = await pivotService.createPivotTable(config);
      log.info('PivotTable created:', pivotTable);

      // Create the IrisGridPivotModel
      const model = new IrisGridPivotModel(dh, pivotTable);

      setPivotModel(model);
      setView('pivot');
    } catch (e) {
      log.error('Failed to create pivot table', e);
    } finally {
      setIsBuilding(false);
    }
  }, [dh, fetch, isPivotView, pspFetch, pivotModel, setView]);

  return {
    isAvailable,
    pivotModel,
    isBuilding,
    handleToggle,
  };
}

export default usePivotToggle;
