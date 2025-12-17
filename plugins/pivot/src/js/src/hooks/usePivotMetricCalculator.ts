import { useMemo } from 'react';
import type { GetMetricCalculatorType } from '@deephaven/iris-grid';
import IrisGridPivotMetricCalculator from '../IrisGridPivotMetricCalculator';

/**
 * Hook that creates a pivot metric calculator
 * @returns Pivot metric calculator
 */
export function usePivotMetricCalculator(): GetMetricCalculatorType {
  return useMemo(() => args => new IrisGridPivotMetricCalculator(args), []);
}

export default usePivotMetricCalculator;
