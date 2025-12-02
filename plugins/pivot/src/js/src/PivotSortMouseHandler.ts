import { ContextActionUtils } from '@deephaven/components';
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
  type GridMouseEvent,
  type Grid,
} from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import { assertNotNull } from '@deephaven/utils';
import { isIrisGridPivotModel } from './IrisGridPivotModel';
import { isPivotColumnHeaderGroup } from './PivotColumnHeaderGroup';

/**
 * Trigger sorting on column source click.
 * Column sources are represented as negative column indexes.
 */
class PivotSortMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.columnSource = null;
    this.irisGrid = irisGrid;
  }

  columnSource: number | null;

  irisGrid: IrisGrid;

  /**
   * Get the column source from a grid point
   * @param gridPoint The grid point to check
   * @returns The column source index if the grid point is in a column source header, else null
   */
  private getColumnSourceHeaderFromGridPoint(
    gridPoint: GridPoint
  ): number | null {
    const { column, row, columnHeaderDepth } = gridPoint;
    const { model } = this.irisGrid.props;
    assertNotNull(model);
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

  // We need to remember where the down started, because the canvas element will trigger a click where mouseUp is
  onDown(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    this.columnSource = this.getColumnSourceHeaderFromGridPoint(gridPoint);
    return false;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    const columnSource = this.getColumnSourceHeaderFromGridPoint(gridPoint);

    if (columnSource != null && columnSource === this.columnSource) {
      const addToExisting = ContextActionUtils.isModifierKeyDown(event);
      this.irisGrid.toggleSort(columnSource, addToExisting);
      return true;
    }

    return false;
  }
}

export default PivotSortMouseHandler;
