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

  onMove(gridPoint: GridPoint): EventHandlerResult {
    const { model } = this.irisGrid.props;
    const { isFilterBarShown, metrics, hoverAdvancedFilter } =
      this.irisGrid.state;

    if (!isFilterBarShown || !metrics) {
      return false;
    }

    if (!isPivotGridMetrics(metrics)) {
      return false;
    }

    const theme = this.irisGrid.getTheme() as IrisGridThemeType &
      IrisGridPivotThemeType;

    if (theme.columnHeaderHeight == null || theme.filterBarHeight == null) {
      return false;
    }

    const { gridY } = metrics;
    const { filterBarHeight } = theme;

    // Check if we're in the column header area (above the regular filter bar)
    const isInColumnHeaderArea = gridPoint.y < gridY - filterBarHeight;

    if (!isInColumnHeaderArea) {
      // Not in column header area - let regular handlers take over
      // Don't clear hover here - let IrisGridFilterMouseHandler handle it
      // to avoid fighting with CSS transitions
      return false;
    }

    // We're in the column header area
    const sourceIndex = getColumnSourceHeaderFromGridPoint(model, gridPoint);

    if (sourceIndex != null) {
      if (
        isGridPointInColumnSourceFilterBox(model, gridPoint, metrics, theme)
      ) {
        // Set hover for columnBy source filter (negative index)
        if (hoverAdvancedFilter !== sourceIndex) {
          this.irisGrid.setState({ hoverAdvancedFilter: sourceIndex });
        }
        // Consume event to prevent IrisGridFilterMouseHandler from interfering
        return true;
      }
    }

    // In column header area but not in a specific filter box
    // Keep current hover stable if it's a columnBy filter to prevent flickering
    if (hoverAdvancedFilter != null && hoverAdvancedFilter < 0) {
      return true;
    }

    return false;
  }

  onLeave(): EventHandlerResult {
    const { hoverAdvancedFilter } = this.irisGrid.state;
    // Clear hover if it was on a columnBy source filter (negative index)
    if (hoverAdvancedFilter != null && hoverAdvancedFilter < 0) {
      this.irisGrid.setState({ hoverAdvancedFilter: null });
    }
    return false;
  }
}

export default PivotFilterMouseHandler;
