import { useMemo } from 'react';
import type { MouseHandlersProp } from '@deephaven/iris-grid';
import PivotColumnGroupMouseHandler from '../PivotColumnGroupMouseHandler';
import PivotSortMouseHandler from '../PivotSortMouseHandler';
import PivotFilterMouseHandler from '../PivotFilterMouseHandler';

/**
 * Hook that creates mouse handlers for pivot grids
 * @returns Mouse handlers array
 */
export function usePivotMouseHandlers(): MouseHandlersProp {
  return useMemo(
    () => [
      irisGrid => new PivotColumnGroupMouseHandler(irisGrid),
      // Filter handler should consume events before sort
      irisGrid => new PivotFilterMouseHandler(irisGrid),
      irisGrid => new PivotSortMouseHandler(irisGrid),
    ],
    []
  );
}

export default usePivotMouseHandlers;
