import {
  IrisGridMetricCalculator,
  type IrisGridMetricState,
} from '@deephaven/iris-grid';
import type { GridMetrics, ModelIndex, ModelSizeMap } from '@deephaven/grid';
import { isIrisGridPivotModel } from './IrisGridPivotModel';

export interface PivotGridMetrics extends GridMetrics {
  // Width of the widest column source header text, including padding
  sourceTextWidth: number;
}

class IrisGridPivotMetricCalculator extends IrisGridMetricCalculator {
  // Gets the text width for a column header group, including padding
  getColumnHeaderGroupTextWidth(
    modelColumn: ModelIndex,
    depth: number,
    state: IrisGridMetricState,
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
}

export default IrisGridPivotMetricCalculator;
