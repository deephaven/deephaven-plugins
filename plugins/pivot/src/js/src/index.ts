import { PivotPlugin } from './PivotPlugin';

// Export legacy dashboard plugin as named export for compatibility with Grizzly
export * from './DashboardPlugin';

// Re-exports consumed by downstream plugins (e.g. pivot-builder) that need
// to construct pivot models directly.
export { default as IrisGridPivotModel } from './IrisGridPivotModel';
export { isCorePlusDh } from './PivotUtils';

export default PivotPlugin;
