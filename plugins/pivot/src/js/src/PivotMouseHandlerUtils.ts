/* eslint-disable import/prefer-default-export */
import type { GridPoint } from '@deephaven/grid';
import type { IrisGridModel } from '@deephaven/iris-grid';
import { isIrisGridPivotModel } from './IrisGridPivotModel';
import { isPivotColumnHeaderGroup } from './PivotColumnHeaderGroup';
import type {
  IrisGridPivotRenderState,
  PivotGridMetrics,
} from './IrisGridPivotTypes';
import { getColumnHeaderCoordinates } from './IrisGridPivotMetricCalculator';
import type { IrisGridPivotThemeType } from './IrisGridPivotTheme';

/**
 * Get the column source from a grid point
 * @param gridPoint The grid point to check
 * @returns The column source index if the grid point is in a column source header, else null
 */
export function getColumnSourceHeaderFromGridPoint(
  model: IrisGridModel,
  gridPoint: GridPoint
): number | null {
  const { column, row, columnHeaderDepth } = gridPoint;
  const sourceIndex = columnHeaderDepth != null ? -columnHeaderDepth : null;

  if (column == null || row !== null || columnHeaderDepth == null) {
    return null;
  }

  const group = model.getColumnHeaderGroup(column, columnHeaderDepth);

  if (
    sourceIndex != null &&
    sourceIndex < 0 &&
    isIrisGridPivotModel(model) &&
    isPivotColumnHeaderGroup(group) &&
    group.isKeyColumnGroup
  ) {
    // Clicked on a column header that is a key column group
    return sourceIndex;
  }

  return null;
}

export function isGridPointInColumnSourceFilterBox(
  model: IrisGridModel,
  gridPoint: GridPoint,
  metrics: PivotGridMetrics,
  theme: IrisGridPivotThemeType
): boolean {
  if (!isIrisGridPivotModel(model)) {
    return false;
  }

  const { column, row, columnHeaderDepth } = gridPoint;
  if (column == null || row !== null || columnHeaderDepth == null) {
    return false;
  }

  const sourceIndex = getColumnSourceHeaderFromGridPoint(model, gridPoint);
  if (sourceIndex == null) {
    return false;
  }

  const group = model.getColumnHeaderGroup(column, columnHeaderDepth);

  if (!isPivotColumnHeaderGroup(group)) {
    return false;
  }

  const coords = getColumnHeaderCoordinates(
    { metrics, theme, model } as IrisGridPivotRenderState,
    group
  );

  if (coords == null) {
    return false;
  }

  const { columnSourceFilterMinWidth } = theme;
  const { columnSourceLabelWidth } = metrics;

  const { x1, x2 } = coords;
  const columnSourceFilterWidth = Math.max(
    x2 - x1 - columnSourceLabelWidth,
    columnSourceFilterMinWidth
  );

  return gridPoint.x > x2 - columnSourceFilterWidth;
}
