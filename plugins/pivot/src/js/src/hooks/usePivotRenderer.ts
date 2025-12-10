import { useMemo } from 'react';
import IrisGridPivotRenderer from '../IrisGridPivotRenderer';

/**
 * Hook that creates a pivot grid renderer
 * @returns Pivot grid renderer
 */
export function usePivotRenderer(): IrisGridPivotRenderer {
  return useMemo(() => new IrisGridPivotRenderer(), []);
}

export default usePivotRenderer;
