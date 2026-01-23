import { useMemo } from 'react';
import type { GetMetricCalculatorType } from '@deephaven/iris-grid';
import IrisGridPivotMetricCalculator from '../IrisGridPivotMetricCalculator';

/**
 * Hook that creates a factory returning a pivot metric calculator
 * @returns Factory returning a pivot metric calculator
 */
export function usePivotMetricCalculatorFactory(): GetMetricCalculatorType {
  return useMemo(
    () =>
      (...args) =>
        new IrisGridPivotMetricCalculator(...args),
    []
  );
}

export default usePivotMetricCalculatorFactory;
