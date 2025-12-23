/* eslint-disable import/prefer-default-export */
import type { GridPoint } from '@deephaven/grid';
import type { IrisGridModel } from '@deephaven/iris-grid';
import { isIrisGridPivotModel } from './IrisGridPivotModel';
import { isPivotColumnHeaderGroup } from './PivotColumnHeaderGroup';

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
    model.isColumnSortable(sourceIndex) &&
    isPivotColumnHeaderGroup(group) &&
    group.isKeyColumnGroup
  ) {
    // Clicked on a sortable column header that is a key column group
    return sourceIndex;
  }

  return null;
}
