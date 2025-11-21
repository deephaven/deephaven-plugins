/* eslint class-methods-use-this: "off" */
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
import IrisGridPivotModel from './IrisGridPivotModel';

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
   *
   * @param gridPoint
   * @returns
   */
  getColumnSourceFromGridPoint(gridPoint: GridPoint): number | null {
    const { column, row, columnHeaderDepth } = gridPoint;
    const { model } = this.irisGrid.props;
    // TODO: limit to only header groups that are column sources
    console.log(
      'getColumnHeaderFromGridPoint',
      {
        gridPoint,
        model,
        columnHeaderDepth,
      },
      model.isColumnSortable(-(columnHeaderDepth ?? 1000))
    );
    assertNotNull(model);
    if (
      column !== null &&
      row === null &&
      columnHeaderDepth != null &&
      columnHeaderDepth > 0 &&
      // TODO:
      model instanceof IrisGridPivotModel &&
      model.isColumnSortable(-columnHeaderDepth)
    ) {
      return -columnHeaderDepth;
    }

    return null;
  }

  // We need to remember where the down started, because the canvas element will trigger a click where mouseUp is
  onDown(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    this.columnSource = this.getColumnSourceFromGridPoint(gridPoint);
    return false;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    const columnSourceIndex = this.getColumnSourceFromGridPoint(gridPoint);
    console.log('[0] onClick', {
      gridPoint,
      columnSourceIndex,
      rememberedColumnSource: this.columnSource,
    });

    if (columnSourceIndex != null && columnSourceIndex === this.columnSource) {
      const addToExisting = ContextActionUtils.isModifierKeyDown(event);
      this.irisGrid.toggleSort(columnSourceIndex, addToExisting);
      return true;
    }

    return false;
  }
}

export default PivotSortMouseHandler;
