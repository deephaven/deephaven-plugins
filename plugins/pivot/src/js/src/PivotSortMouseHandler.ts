/* eslint class-methods-use-this: "off" */
import { ContextActionUtils } from '@deephaven/components';
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
  type GridMouseEvent,
  type Grid,
  type GridRangeIndex,
} from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import IrisGridPivotModel from './IrisGridPivotModel';

const log = Log.module('@deephaven/js-plugin-pivot/PivotSortMouseHandler');

/**
 * Trigger quick filters and advanced filters
 */
class PivotSortMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.columnSource = null;
    this.irisGrid = irisGrid;
  }

  columnSource: number | null;

  irisGrid: IrisGrid;

  getColumnFromGridPoint(gridPoint: GridPoint): GridRangeIndex {
    const { column, row, columnHeaderDepth } = gridPoint;
    if (column !== null && row === null && columnHeaderDepth === 0) {
      return column;
    }

    return null;
  }

  getColumnSourceFromGridPoint(gridPoint: GridPoint): number | null {
    const { column, row, columnHeaderDepth } = gridPoint;
    const { model } = this.irisGrid.props;
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
    if (columnSourceIndex != null && columnSourceIndex === this.columnSource) {
      const addToExisting = ContextActionUtils.isModifierKeyDown(event);
      this.irisGrid.toggleSort(columnSourceIndex, addToExisting);
      return true;
    }

    return false;
  }

  // onMove(gridPoint: GridPoint): EventHandlerResult {
  //   const { y, column } = gridPoint;
  //   const { isFilterBarShown, hoverAdvancedFilter, metrics } =
  //     this.irisGrid.state;
  //   if (!metrics) throw new Error('Metrics not set');
  //   const { columnHeaderMaxDepth } = metrics;
  //   const theme = this.irisGrid.getTheme();

  //   let newHoverAdvancedFilter = null;
  //   if (
  //     isFilterBarShown &&
  //     theme.columnHeaderHeight != null &&
  //     theme.filterBarHeight != null &&
  //     column !== null &&
  //     y > 0 &&
  //     y <= theme.columnHeaderHeight * (columnHeaderMaxDepth - 1) &&
  //     column <= 3 // TODO: temporary limit until filter UI is done
  //   ) {
  //     newHoverAdvancedFilter = column;
  //   }

  //   console.log('[plugins] newHoverAdvancedFilter', newHoverAdvancedFilter);

  //   if (newHoverAdvancedFilter !== hoverAdvancedFilter) {
  //     this.irisGrid.setState({ hoverAdvancedFilter: newHoverAdvancedFilter });
  //   }

  //   // Stop propagation to block original onMove behavior
  //   return true;
  // }

  // onLeave(gridPoint: GridPoint): EventHandlerResult {
  //   const { column } = gridPoint;
  //   const { hoverAdvancedFilter } = this.irisGrid.state;
  //   if (hoverAdvancedFilter !== null && column !== hoverAdvancedFilter) {
  //     this.irisGrid.setState({ hoverAdvancedFilter: null });
  //   }

  //   return false;
  // }
}

export default PivotSortMouseHandler;
