import { PivotPlugin } from './PivotPlugin';

// Export legacy dashboard plugin as named export for compatibility with Grizzly
export * from './DashboardPlugin';

// Re-exports consumed by downstream plugins (e.g. pivot-builder) that need
// to construct pivot models directly.
export {
  default as IrisGridPivotModel,
  isIrisGridPivotModel,
} from './IrisGridPivotModel';
export { isCorePlusDh } from './PivotUtils';
export { default as usePivotMouseHandlers } from './hooks/usePivotMouseHandlers';
export { default as usePivotRenderer } from './hooks/usePivotRenderer';
export { default as usePivotMetricCalculatorFactory } from './hooks/usePivotMetricCalculatorFactory';
export { default as usePivotTheme } from './hooks/usePivotTheme';

export default PivotPlugin;
