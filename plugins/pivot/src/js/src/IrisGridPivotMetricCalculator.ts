import {
  IrisGridMetricCalculator,
  type IrisGridMetricState,
} from '@deephaven/iris-grid';
import memoize from 'memoize-one';
import {
  GridUtils,
  type BoxCoordinates,
  type GridMetrics,
  type ModelIndex,
  type VisibleIndex,
} from '@deephaven/grid';
import Log from '@deephaven/log';
import IrisGridPivotModel, { isIrisGridPivotModel } from './IrisGridPivotModel';
import PivotColumnHeaderGroup, {
  isPivotColumnHeaderGroup,
} from './PivotColumnHeaderGroup';
import {
  type IrisGridPivotMetricState,
  type IrisGridPivotRenderState,
  type PivotGridMetrics,
} from './IrisGridPivotTypes';
import { getKeyColumnGroups } from './PivotUtils';

const log = Log.module(
  '@deephaven/js-plugin-pivot/IrisGridPivotMetricCalculator'
);

/**
 * Get the width of a column that may be not in the viewport,
 * based on the user, calculated, and theme widths.
 * @param column The visible index of the column
 * @param metrics The grid metrics
 * @param themeColumnWidth The default column width from the theme
 * @returns The width of the column
 */
export function getColumnWidth(
  column: VisibleIndex,
  metrics: PivotGridMetrics,
  themeColumnWidth: number
): number {
  const {
    firstColumn,
    allColumnWidths,
    calculatedColumnWidths,
    userColumnWidths,
    treePaddingX,
  } = metrics;

  const modelColumn = GridUtils.getModelIndex(column, metrics.movedColumns);

  // userColumnWidths and allColumnWidths include the treePaddingX on the first column
  // calculatedColumnWidths does not, so we need to account for that here
  // See GridMetricCalculator.calculateColumnWidth for reference
  return (
    userColumnWidths.get(modelColumn) ??
    allColumnWidths.get(column) ??
    (calculatedColumnWidths.has(modelColumn)
      ? (calculatedColumnWidths.get(modelColumn) ?? 0) +
        (column === firstColumn ? treePaddingX : 0)
      : undefined) ??
    themeColumnWidth
  );
}

/**
 * Get the coordinates of a column header group
 * @param state The current render state of the IrisGridPivot
 * @param group The PivotColumnHeaderGroup for which to get coordinates
 * @returns The BoxCoordinates for the group, or null if not visible
 */
export function getColumnHeaderCoordinates(
  state: IrisGridPivotRenderState,
  group: PivotColumnHeaderGroup
): BoxCoordinates | null {
  const { metrics, theme } = state;
  const { childIndexes, depth } = group;
  const firstChildIndex = childIndexes[0];
  const lastChildIndex = childIndexes[childIndexes.length - 1];
  if (firstChildIndex == null || lastChildIndex == null) {
    throw new Error('Group has no child columns');
  }
  const { left, right, allColumnXs, allColumnWidths, gridX, gridY, maxX } =
    metrics;
  const {
    filterBarHeight,
    columnHeaderHeight,
    columnWidth: themeColumnWidth,
  } = theme;

  const firstVisible = Math.max(left, firstChildIndex);
  const lastVisible = Math.min(right, lastChildIndex);
  if (firstVisible > lastChildIndex || lastVisible < firstChildIndex) {
    // Group is not visible
    return null;
  }

  // Calculate the left edge by summing widths of all columns before firstVisible
  const firstVisibleX = allColumnXs.get(firstVisible);
  if (firstVisibleX == null) {
    return null;
  }
  let groupX1 = firstVisibleX;
  for (let i = firstChildIndex; i < firstVisible; i += 1) {
    groupX1 -= getColumnWidth(i, metrics, themeColumnWidth);
  }

  const lastColumnX = allColumnXs.get(lastVisible);
  const lastColumnWidth = allColumnWidths.get(lastVisible);
  if (lastColumnX == null || lastColumnWidth == null) {
    return null;
  }
  return {
    x1: gridX + groupX1,
    y1: gridY - filterBarHeight - (depth + 1) * columnHeaderHeight,
    x2: Math.min(gridX + lastColumnX + lastColumnWidth, maxX),
    y2: gridY - filterBarHeight - depth * columnHeaderHeight,
  };
}

/**
 * Type predicate to check if a metric calculator is an IrisGridPivotMetricCalculator
 * @param calculator The metric calculator to check
 * @returns True if the calculator is an IrisGridPivotMetricCalculator
 */
export function isIrisGridPivotMetricCalculator(
  calculator: IrisGridMetricCalculator
): calculator is IrisGridPivotMetricCalculator {
  return calculator instanceof IrisGridPivotMetricCalculator;
}

class IrisGridPivotMetricCalculator extends IrisGridMetricCalculator {
  private getCachedColumnSourceLabelWidth = memoize(
    (
      keyColumnGroups: PivotColumnHeaderGroup[],
      headerHorizontalPadding: number,
      maxColumnWidth: number,
      state: IrisGridPivotMetricState
    ): number => {
      let result = 0;
      keyColumnGroups.forEach(group => {
        const sourceIndex = -group.depth;
        const width = this.getColumnHeaderGroupTextWidth(
          sourceIndex,
          0,
          state,
          maxColumnWidth
        );
        result = Math.max(result, width + headerHorizontalPadding);
      });
      return result;
    }
  );

  // Gets the text width for a column header group, including padding
  getColumnHeaderGroupTextWidth(
    modelColumn: ModelIndex,
    depth: number,
    state: IrisGridPivotMetricState,
    maxColumnWidth: number
  ): number {
    return super.getColumnHeaderGroupWidth(
      modelColumn,
      depth,
      state,
      maxColumnWidth
    );
  }

  getColumnHeaderGroupWidth(
    modelColumn: ModelIndex,
    depth: number,
    state: IrisGridPivotMetricState,
    maxColumnWidth: number
  ): number {
    return this.getColumnHeaderGroupTextWidth(
      modelColumn,
      depth,
      state,
      maxColumnWidth
    );
  }

  /**
   * Calculate the width needed for the column source labels
   * @param model The IrisGridPivotModel instance
   * @param state The current IrisGridPivotMetricState
   * @returns The calculated width for the column source labels
   */
  calculateColumnSourceLabelWidth(
    model: IrisGridPivotModel,
    state: IrisGridPivotMetricState
  ): number {
    const { theme } = state;
    const { headerHorizontalPadding, maxColumnWidth } = theme;
    const keyColumnGroups = getKeyColumnGroups(model);

    return this.getCachedColumnSourceLabelWidth(
      keyColumnGroups,
      headerHorizontalPadding,
      maxColumnWidth,
      state
    );
  }

  /**
   * Gets the metrics for the current state. This method has to be called before setColumnSize or resetColumnSize.
   * @param state The current IrisGridPivotMetricState
   * @returns The metrics for the current state
   */
  getMetrics(state: IrisGridPivotMetricState): PivotGridMetrics {
    const { model } = state;

    if (!isIrisGridPivotModel(model)) {
      throw new Error('Model is not an IrisGridPivotModel');
    }

    // Update column widths if columns in the cached model don't match the current model passed in the state
    const columnSourceLabelWidth = this.calculateColumnSourceLabelWidth(
      model,
      state
    );

    return {
      ...super.getMetrics(state),
      columnSourceLabelWidth,
    };
  }

  /**
   * Get metrics for positioning the filter bar input field.
   * @param index The visible index of the column to get the filter box coordinates for
   * @param state The current IrisGridMetricState
   * @param metrics The grid metrics
   * @returns Coordinates for the filter input field, or null if positioning cannot be calculated
   */
  // eslint-disable-next-line class-methods-use-this
  getFilterInputCoordinates(
    index: VisibleIndex,
    state: IrisGridPivotMetricState,
    metrics: PivotGridMetrics
  ): { x: number; y: number; width: number; height: number } | null {
    if (index >= 0) {
      log.debug('getFilterInputCoordinates for index:', index);
      return super.getFilterInputCoordinates(index, state, metrics);
    }

    const { model, theme } = state;
    if (!isIrisGridPivotModel(model)) {
      return null;
    }

    const { gridY, columnSourceLabelWidth } = metrics;

    const { columnSourceFilterMinWidth, filterBarHeight } = theme;

    // Find the key column group for this source index
    // index is negative (-1, -2, etc.), and depth is positive (1, 2, etc.)
    const depth = -index;
    const keyColumnGroup = model.getColumnHeaderGroup(0, depth);

    if (
      keyColumnGroup == null ||
      !isPivotColumnHeaderGroup(keyColumnGroup) ||
      !keyColumnGroup.isKeyColumnGroup
    ) {
      return null;
    }

    // Get the coordinates of the key column group
    const groupCoords = getColumnHeaderCoordinates(
      { metrics, theme, model } as IrisGridPivotRenderState,
      keyColumnGroup
    );

    if (groupCoords == null) {
      return null;
    }

    const groupWidth = groupCoords.x2 - groupCoords.x1;
    const columnWidth = Math.max(
      columnSourceFilterMinWidth,
      groupWidth - columnSourceLabelWidth
    );

    const x = groupCoords.x2 - columnWidth;
    const y =
      gridY - theme.columnHeaderHeight - (1 - index) * (filterBarHeight ?? 0);
    const fieldWidth = columnWidth + 1; // cover right border
    const fieldHeight = (filterBarHeight ?? 0) - 1; // remove bottom border

    return {
      x,
      y,
      width: fieldWidth,
      height: fieldHeight,
    };
  }

  /**
   * Calculate the new left index to bring the given column into view.
   * @param column The column that should be scrolled into view
   * @param state The current IrisGridMetricState
   * @param metrics The grid metrics
   * @returns The left column index to scroll to, or null if no scroll is needed
   */
  getScrollLeftForColumn(
    column: VisibleIndex,
    state: IrisGridMetricState,
    metrics: GridMetrics
  ): VisibleIndex | null {
    if (column < 0) {
      return 0;
    }

    return super.getScrollLeftForColumn(column, state, metrics);
  }
}

export default IrisGridPivotMetricCalculator;
