/* eslint class-methods-use-this: "off" */
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
  type Grid,
  type GridMouseEvent,
} from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import { assertNotNull } from '@deephaven/utils';
import { getColumnSourceHeaderFromGridPoint } from './PivotMouseHandlerUtils';
import { isPivotGridMetrics } from './IrisGridPivotTypes';

/**
 * Trigger quick filters on pivot columnBy source headers
 */
class PivotFilterMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  onDown(gridPoint: GridPoint): EventHandlerResult {
    const { model } = this.irisGrid.props;
    const { isFilterBarShown, metrics } = this.irisGrid.state;

    const sourceIndex = getColumnSourceHeaderFromGridPoint(model, gridPoint);

    if (sourceIndex != null) {
      assertNotNull(metrics, 'Metrics not set');

      if (!isPivotGridMetrics(metrics)) {
        throw new Error('PivotGridMetrics required');
      }
      const theme = this.irisGrid.getTheme();

      const { columnSourceLabelWidth } = metrics;

      if (
        isFilterBarShown &&
        theme.columnHeaderHeight != null &&
        theme.filterBarHeight != null &&
        gridPoint.x > columnSourceLabelWidth
      ) {
        this.irisGrid.focusFilterBar(sourceIndex);
        return true;
      }
    }

    return false;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    const { model } = this.irisGrid.props;
    const { isFilterBarShown, metrics } = this.irisGrid.state;

    const sourceIndex = getColumnSourceHeaderFromGridPoint(model, gridPoint);

    if (sourceIndex != null) {
      assertNotNull(metrics, 'Metrics not set');

      if (!isPivotGridMetrics(metrics)) {
        throw new Error('PivotGridMetrics required');
      }

      const theme = this.irisGrid.getTheme();

      const { columnSourceLabelWidth } = metrics;

      // Consume onClick if clicked within the filter box
      if (
        isFilterBarShown &&
        theme.columnHeaderHeight != null &&
        theme.filterBarHeight != null &&
        gridPoint.x > columnSourceLabelWidth
      ) {
        return true;
      }
    }

    return false;
  }
}

export default PivotFilterMouseHandler;
