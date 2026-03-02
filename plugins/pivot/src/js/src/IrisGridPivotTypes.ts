import {
  type IrisGridMetricState,
  type IrisGridRenderState,
  type IrisGridThemeType,
} from '@deephaven/iris-grid';
import { type GridMetrics } from '@deephaven/grid';
import type IrisGridPivotModel from './IrisGridPivotModel';
import type { IrisGridPivotThemeType } from './IrisGridPivotTheme';

export function isPivotGridMetrics(
  metrics: GridMetrics
): metrics is PivotGridMetrics {
  return (metrics as PivotGridMetrics).columnSourceLabelWidth !== undefined;
}

export interface PivotGridMetrics extends GridMetrics {
  // Width of the widest column source header text, including padding
  columnSourceLabelWidth: number;
}

export interface IrisGridPivotMetricState extends IrisGridMetricState {
  columnSourceFilterMinWidth: number;
  theme: IrisGridThemeType & IrisGridPivotThemeType;
}

export type IrisGridPivotRenderState = IrisGridRenderState & {
  model: IrisGridPivotModel;
  theme: IrisGridThemeType & Partial<IrisGridPivotThemeType>;
  metrics: PivotGridMetrics;
};
