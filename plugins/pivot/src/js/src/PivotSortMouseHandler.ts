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
import type PivotColumnHeaderGroup from './PivotColumnHeaderGroup';
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
   *
   * @param gridPoint
   * @returns
   */
  getColumnSourceFromGridPoint(gridPoint: GridPoint): number | null {
    const { column, row, columnHeaderDepth } = gridPoint;
    const { model } = this.irisGrid.props;
    assertNotNull(model);
    const keyColumnGroups = [...model.columnHeaderGroupMap.values()].filter(
      (group): group is PivotColumnHeaderGroup =>
        isPivotColumnHeaderGroup(group) && group.isKeyColumnGroup
    );
    const sourceIndex = columnHeaderDepth != null ? -columnHeaderDepth : null;
    if (
      column !== null &&
      row === null &&
      sourceIndex != null &&
      sourceIndex < 0 &&
      isIrisGridPivotModel(model) &&
      model.isColumnSortable(sourceIndex) &&
      column <= keyColumnGroups.length
    ) {
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
    this.columnSource = this.getColumnSourceFromGridPoint(gridPoint);
    return false;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    const columnSource = this.getColumnSourceFromGridPoint(gridPoint);

    if (columnSource != null && columnSource === this.columnSource) {
      const addToExisting = ContextActionUtils.isModifierKeyDown(event);
      this.irisGrid.toggleSort(columnSource, addToExisting);
      return true;
    }

    return false;
  }
}

export default PivotSortMouseHandler;
