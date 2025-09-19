/* eslint class-methods-use-this: "off" */
import {
  Grid,
  GridMouseEvent,
  GridMouseHandler,
  GridPoint,
  GridRangeIndex,
  EventHandlerResult,
} from '@deephaven/grid';
import { IrisGridType } from '@deephaven/iris-grid';

/**
 * Used to handle expand/collapse on column header click
 */
class PivotColumnGroupMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGridType) {
    super();

    this.column = null;
    this.irisGrid = irisGrid;
  }

  column: GridRangeIndex;

  irisGrid: IrisGridType;

  getColumnGroupFromGridPoint(gridPoint: GridPoint): GridRangeIndex {
    const { column, row, columnHeaderDepth } = gridPoint;
    if (column !== null && row === null && (columnHeaderDepth ?? 0) > 0) {
      return column;
    }

    return null;
  }

  // We need to remember where the down started, because the canvas element will trigger a click wherever mouseUp is
  onDown(gridPoint: GridPoint): EventHandlerResult {
    this.column = this.getColumnGroupFromGridPoint(gridPoint);
    return false;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    const column = this.getColumnGroupFromGridPoint(gridPoint);
    if (column != null && column === this.column) {
      this.irisGrid.toggleExpandColumn(column);
      return true;
    }

    return false;
  }
}

export default PivotColumnGroupMouseHandler;
