/* eslint class-methods-use-this: "off" */
import {
  Grid,
  GridMouseEvent,
  GridMouseHandler,
  GridPoint,
  GridRangeIndex,
  EventHandlerResult,
  GridUtils,
} from '@deephaven/grid';
import { IrisGridType } from '@deephaven/iris-grid';
import { isPivotColumnHeaderGroup } from './PivotColumnHeaderGroup';

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

  private setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { column, columnHeaderDepth } = gridPoint;
    if (this.isExpandableColumnGroup(column, columnHeaderDepth)) {
      this.cursor = 'pointer';
      return { stopPropagation: false, preventDefault: false };
    }

    this.cursor = null;
    return false;
  }

  private isExpandableColumnGroup(
    column: GridRangeIndex,
    columnHeaderDepth = 0
  ): boolean {
    const { model } = this.irisGrid.props;
    if (column == null || model == null) {
      return false;
    }
    const group = model.getColumnHeaderGroup(column, columnHeaderDepth);
    return (
      group != null && isPivotColumnHeaderGroup(group) && group.isExpandable
    );
  }

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return this.setCursor(gridPoint, grid);
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
    if (
      column != null &&
      column === this.column &&
      this.isExpandableColumnGroup(column, gridPoint.columnHeaderDepth)
    ) {
      this.irisGrid.toggleExpandColumn(
        column,
        // TODO: update types
        GridUtils.isModifierKeyDown(event)
      );
      return true;
    }

    return false;
  }
}

export default PivotColumnGroupMouseHandler;
