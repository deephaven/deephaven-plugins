/* eslint class-methods-use-this: "off" */
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
  type Grid,
  type GridMouseEvent,
} from '@deephaven/grid';
import {
  IrisGridType as IrisGrid,
  type IrisGridState,
} from '@deephaven/iris-grid';
import { assertNotNull } from '@deephaven/utils';
import { getColumnSourceHeaderFromGridPoint } from './PivotMouseHandlerUtils';
import type IrisGridPivotMetricCalculator from './IrisGridPivotMetricCalculator';
import type { PivotGridMetrics } from './IrisGridPivotTypes';

interface IrisGridPivotState extends IrisGridState {
  metricCalculator: IrisGridPivotMetricCalculator;
  metrics?: PivotGridMetrics;
}

interface IrisGridPivot extends IrisGrid {
  metricCalculator: IrisGridPivotMetricCalculator;
  state: IrisGridPivotState;
}

/**
 * Trigger quick filters on pivot columnBy source headers
 */
class PivotFilterMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGridPivot) {
    super();

    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGridPivot;

  onDown(gridPoint: GridPoint): EventHandlerResult {
    const { model } = this.irisGrid.props;
    const { isFilterBarShown, metrics } = this.irisGrid.state;

    const sourceIndex = getColumnSourceHeaderFromGridPoint(model, gridPoint);

    if (sourceIndex != null) {
      if (!metrics) throw new Error('Metrics not set');
      assertNotNull(
        metrics.sourceTextWidth,
        'sourceTextWidth not set in metrics'
      );

      const theme = this.irisGrid.getTheme();

      const { sourceTextWidth } = metrics;

      if (
        isFilterBarShown &&
        theme.columnHeaderHeight != null &&
        theme.filterBarHeight != null &&
        gridPoint.x > sourceTextWidth
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
      if (!metrics) throw new Error('Metrics not set');
      assertNotNull(
        metrics.sourceTextWidth,
        'sourceTextWidth not set in metrics'
      );

      const theme = this.irisGrid.getTheme();

      const { sourceTextWidth } = metrics;

      // Consume onClick if clicked within the filter box
      if (
        isFilterBarShown &&
        theme.columnHeaderHeight != null &&
        theme.filterBarHeight != null &&
        gridPoint.x > sourceTextWidth
      ) {
        return true;
      }
    }

    return false;
  }
}

export default PivotFilterMouseHandler;
