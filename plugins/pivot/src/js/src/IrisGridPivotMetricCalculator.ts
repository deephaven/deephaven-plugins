import {
  IrisGridMetricCalculator,
  type IrisGridMetricState,
  type IrisGridThemeType,
} from '@deephaven/iris-grid';
import {
  GridUtils,
  type GridMetrics,
  type ModelIndex,
  type ModelSizeMap,
  type VisibleIndex,
} from '@deephaven/grid';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import { isIrisGridPivotModel } from './IrisGridPivotModel';
import { isPivotColumnHeaderGroup } from './PivotColumnHeaderGroup';
import type { IrisGridPivotThemeType } from './IrisGridPivotTheme';

const log = Log.module(
  '@deephaven/js-plugin-pivot/IrisGridPivotMetricCalculator'
);

export interface PivotGridMetrics extends GridMetrics {
  // Width of the widest column source header text, including padding
  sourceTextWidth: number;
}

export interface IrisGridPivotMetricState extends IrisGridMetricState {
  columnSourceFilterMinWidth: number;
  theme: IrisGridThemeType & IrisGridPivotThemeType;
}

class IrisGridPivotMetricCalculator extends IrisGridMetricCalculator {
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
    state: IrisGridMetricState,
    maxColumnWidth: number
  ): number {
    return this.getColumnHeaderGroupTextWidth(
      modelColumn,
      depth,
      state,
      maxColumnWidth
    );
  }

  // TODO: fix performance, cache results?
  calculateSourceTextWidths(
    model: unknown,
    state: IrisGridMetricState
  ): ModelSizeMap {
    const sourceTextWidths: ModelSizeMap = new Map();
    if (!isIrisGridPivotModel(model)) {
      return sourceTextWidths;
    }

    const { theme } = state;
    const { headerHorizontalPadding, maxColumnWidth } = theme;

    // TODO: iterate over parents of column 0 to find source columns

    const sourceIndexes: ModelIndex[] = Object.keys(model.columns)
      .map(Number)
      .filter(key => key < 0);

    sourceIndexes.forEach(sourceIndex => {
      const width = this.getColumnHeaderGroupTextWidth(
        sourceIndex,
        0,
        state,
        maxColumnWidth
      );
      // Extra padding between the text and the sort icon
      sourceTextWidths.set(sourceIndex, width + headerHorizontalPadding);
    });
    return sourceTextWidths;
  }

  /**
   * Gets the metrics for the current state. This method has to be called before setColumnSize or resetColumnSize.
   * @param state The current IrisGridMetricState
   * @returns The metrics for the current state
   */
  getMetrics(state: IrisGridMetricState): PivotGridMetrics {
    const { model } = state;
    // Update column widths if columns in the cached model don't match the current model passed in the state
    const sourceTextWidths = this.calculateSourceTextWidths(model, state);

    const sourceTextWidth = Math.max(...sourceTextWidths.values());

    return {
      ...super.getMetrics(state),
      sourceTextWidth,
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

    assertNotNull(metrics.sourceTextWidth, 'sourceTextWidth is null');

    const {
      allColumnXs,
      allColumnWidths,
      gridX,
      gridY,
      sourceTextWidth,
      left,
      leftOffset,
      userColumnWidths,
      movedColumns,
    } = metrics;

    const {
      columnSourceFilterMinWidth,
      filterBarHeight,
      columnWidth: themeColumnWidth,
    } = theme;

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

    const firstChildIndex = keyColumnGroup.childIndexes[0];
    const lastChildIndex =
      keyColumnGroup.childIndexes[keyColumnGroup.childIndexes.length - 1];

    if (firstChildIndex == null || lastChildIndex == null) {
      return null;
    }

    // Calculate the absolute left edge of the group by summing all column widths from the start
    let groupX1 = 0;
    for (let i = 0; i < firstChildIndex; i += 1) {
      const modelIndex = GridUtils.getModelIndex(i, movedColumns) ?? i;
      const width =
        userColumnWidths.get(modelIndex) ??
        allColumnWidths.get(i) ??
        themeColumnWidth;
      groupX1 += width;
    }

    // Calculate the absolute right edge
    let groupX2 = groupX1;
    for (let i = firstChildIndex; i <= lastChildIndex; i += 1) {
      const modelIndex = GridUtils.getModelIndex(i, movedColumns) ?? i;
      const width =
        userColumnWidths.get(modelIndex) ??
        allColumnWidths.get(i) ??
        themeColumnWidth;
      groupX2 += width;
    }

    // Adjust for scroll position
    groupX1 -= leftOffset;
    groupX2 -= leftOffset;

    const groupWidth = groupX2 - groupX1;

    const columnWidth = Math.max(
      columnSourceFilterMinWidth,
      groupWidth - sourceTextWidth
    );

    const columnX = groupX2 - columnWidth;

    const columnY =
      -theme.columnHeaderHeight - (1 - index) * (filterBarHeight ?? 0);
    if (columnX != null && columnWidth != null) {
      const x = gridX + columnX;
      const y = gridY + columnY;
      const fieldWidth = columnWidth + 1; // cover right border
      const fieldHeight = (filterBarHeight ?? 0) - 1; // remove bottom border
      return {
        x,
        y,
        width: fieldWidth,
        height: fieldHeight,
      };
    }

    return null;
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
