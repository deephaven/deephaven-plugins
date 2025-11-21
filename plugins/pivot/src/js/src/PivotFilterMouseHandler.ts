/* eslint class-methods-use-this: "off" */
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
} from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-pivot/PivotFilterMouseHandler');

/**
 * Trigger quick filters and advanced filters
 */
class PivotFilterMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  onDown(gridPoint: GridPoint): EventHandlerResult {
    const { x, y, column, row, columnHeaderDepth } = gridPoint;
    if (column != null && columnHeaderDepth != null && row === null) {
      const { isFilterBarShown, metrics } = this.irisGrid.state;
      if (!metrics) throw new Error('Metrics not set');

      const { columnHeaderMaxDepth } = metrics;
      const theme = this.irisGrid.getTheme();
      // TODO: check X
      const sourceIndex = -columnHeaderDepth;
      log.debug('onDown', {
        x,
        y,
        column,
        row,
        sourceIndex,
        columnHeaderMaxDepth,
      });
      if (
        isFilterBarShown &&
        theme.columnHeaderHeight != null &&
        theme.filterBarHeight != null &&
        y > 0 &&
        y <= theme.columnHeaderHeight * columnHeaderMaxDepth &&
        column <= 3 // TODO: temporary limit until filter UI is done
      ) {
        this.irisGrid.focusFilterBar(sourceIndex);
        return true;
      }
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

export default PivotFilterMouseHandler;
