import { PivotPlugin } from './PivotPlugin';

// Export legacy dashboard plugin as named export for compatibility with Grizzly
export * from './DashboardPlugin';

// Export pivot model and utilities for use by other plugins
export { default as IrisGridPivotModel } from './IrisGridPivotModel';
export { isIrisGridPivotModel } from './IrisGridPivotModel';
export { isCorePlusDh } from './PivotUtils';
export { useIrisGridPivotModel } from './useIrisGridPivotModel';
export { usePivotTableFetch } from './hooks/usePivotTableFetch';
export { usePivotMouseHandlers } from './hooks/usePivotMouseHandlers';
export { usePivotRenderer } from './hooks/usePivotRenderer';
export { usePivotTheme } from './hooks/usePivotTheme';
export { default as usePivotMetricCalculatorFactory } from './hooks/usePivotMetricCalculatorFactory';

export default PivotPlugin;
