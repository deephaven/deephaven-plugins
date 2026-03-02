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
  type IrisGridThemeType,
} from '@deephaven/iris-grid';
import { assertNotNull } from '@deephaven/utils';
import {
  getColumnSourceHeaderFromGridPoint,
  isGridPointInColumnSourceFilterBox,
} from './PivotMouseHandlerUtils';
import { isPivotGridMetrics } from './IrisGridPivotTypes';
import type { IrisGridPivotThemeType } from './IrisGridPivotTheme';

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
      const theme = this.irisGrid.getTheme() as IrisGridThemeType &
        IrisGridPivotThemeType;

      if (
        isFilterBarShown &&
        theme.columnHeaderHeight != null &&
        theme.filterBarHeight != null &&
        isGridPointInColumnSourceFilterBox(model, gridPoint, metrics, theme)
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

      const theme = this.irisGrid.getTheme() as IrisGridThemeType &
        IrisGridPivotThemeType;

      // Consume onClick if clicked within the filter box
      if (
        isFilterBarShown &&
        theme.columnHeaderHeight != null &&
        theme.filterBarHeight != null &&
        isGridPointInColumnSourceFilterBox(model, gridPoint, metrics, theme)
      ) {
        return true;
      }
    }

    return false;
  }
}

export default PivotFilterMouseHandler;
