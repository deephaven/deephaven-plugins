import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { type dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { type IrisGridModel } from '@deephaven/iris-grid';
import { useObjectFetch } from '@deephaven/jsapi-bootstrap';
import { IrisGridPivotModel, isCorePlusDh } from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-grid-toolbar/usePivotToggle');

export const NUMERIC_TYPES = new Set([
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

/** Column metadata exposed to the pivot builder dialog */
export interface ColumnInfo {
  name: string;
  type: string;
  isNumeric: boolean;
}

/** User-configured pivot settings from the builder dialog */
export interface PivotConfig {
  rowKeys: string[];
  columnKeys: string[];
  aggregations: Record<string, string[]>;
}

export interface PivotToggleResult {
  /** Whether CorePlus pivot API is available */
  isAvailable: boolean;
  /** The IrisGridModel for the pivot table, or null if not in pivot view */
  pivotModel: IrisGridModel | null;
  /** Whether pivot creation is in progress */
  isBuilding: boolean;
  /** Fetch column metadata from the source table */
  fetchColumns: () => Promise<ColumnInfo[]>;
  /** Build a pivot table with the given config */
  buildPivot: (config: PivotConfig) => Promise<void>;
  /** Close the current pivot view and return to grid */
  closePivot: () => void;
}

/**
 * Hook to toggle between grid and pivot views.
 * Creates a PivotTable from the fetched table using PivotService with auto-detected defaults.
 */
export function usePivotToggle(
  dh: typeof DhType | typeof CorePlusDhType,
  fetch: () => Promise<unknown>,
  setView: (view: 'grid' | 'pivot') => void,
  metadata?: DhType.ide.VariableDescriptor
): PivotToggleResult {
  const [pivotModel, setPivotModel] = useState<IrisGridModel | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  // Whether we've probed the PivotService and confirmed it exists
  const [isPivotServiceConfirmed, setIsPivotServiceConfirmed] = useState(false);

  // Build a descriptor for the PivotService variable on the same query.
  // The PivotService may be exported under any name (commonly 'psp'),
  // so we use a well-known name for the initial subscription and then
  // probe eagerly to confirm the service actually exists.
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

  // Eagerly probe the PivotService when the fetch becomes ready.
  // The ObjectFetchManager only checks if the query is running, not whether
  // the specific variable exists. We do a real fetch to confirm availability.
  useEffect(() => {
    if (pspFetch.status !== 'ready') {
      setIsPivotServiceConfirmed(false);
      return;
    }
    let cancelled = false;
    pspFetch
      .fetch()
      .then(() => {
        if (!cancelled) {
          log.info('PivotService confirmed available on this query');
          setIsPivotServiceConfirmed(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          log.debug(
            'PivotService not found on this query (fetch probe failed)'
          );
          setIsPivotServiceConfirmed(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pspFetch]);

  const isAvailable = isCorePlusDh(dh) && isPivotServiceConfirmed;

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

  const fetchColumns = useCallback(async (): Promise<ColumnInfo[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (await fetch()) as any;
    if (table?.columns == null) {
      log.warn('Fetched object has no columns');
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return table.columns.map((col: any) => ({
      name: col.name as string,
      type: col.type as string,
      isNumeric: NUMERIC_TYPES.has(col.type),
    }));
  }, [fetch]);

  const buildPivot = useCallback(
    async (config: PivotConfig) => {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ])) as [any, any];

        if (table?.columns == null) {
          log.warn('Fetched object has no columns; cannot build pivot');
          return;
        }

        const pivotConfig = {
          source: table,
          rowKeys: config.rowKeys,
          columnKeys: config.columnKeys,
          aggregations: config.aggregations,
        };

        log.info('Creating pivot with config:', pivotConfig);

        // Get PivotService from the psp widget, then create PivotTable
        const corePlusDh = dh as typeof CorePlusDhType;
        const pivotService =
          await corePlusDh.coreplus.pivot.PivotService.getInstance(pspWidget);
        log.info('PivotService obtained:', pivotService);
        const pivotTable = await pivotService.createPivotTable(pivotConfig);
        log.info('PivotTable created:', pivotTable);

        // Create the IrisGridPivotModel
        const model = new IrisGridPivotModel(dh, pivotTable);

        // Close the previous model before replacing it
        pivotModelRef.current?.close();
        setPivotModel(model);
        setView('pivot');
      } catch (e) {
        log.error('Failed to create pivot table', e);
      } finally {
        setIsBuilding(false);
      }
    },
    [dh, fetch, pspFetch, setView]
  );

  const closePivot = useCallback(() => {
    pivotModel?.close();
    setPivotModel(null);
    setView('grid');
  }, [pivotModel, setView]);

  return {
    isAvailable,
    pivotModel,
    isBuilding,
    fetchColumns,
    buildPivot,
    closePivot,
  };
}

export default usePivotToggle;
