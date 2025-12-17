import {
  IrisGridMetricCalculator,
  type IrisGridMetricState,
} from '@deephaven/iris-grid';
import type { ModelIndex } from '@deephaven/grid';
import { isIrisGridPivotModel } from './IrisGridPivotModel';

class IrisGridPivotMetricCalculator extends IrisGridMetricCalculator {
  getColumnHeaderGroupWidth(
    modelColumn: ModelIndex,
    depth: number,
    state: IrisGridMetricState,
    maxColumnWidth: number
  ): number {
    // Base width includes padding
    const baseWidth = super.getColumnHeaderGroupWidth(
      modelColumn,
      depth,
      state,
      maxColumnWidth
    );
    const { model } = state;
    if (!isIrisGridPivotModel(model)) {
      return baseWidth;
    }
    // Space between text and the filter input
    // Should match CSS padding: TODO: verify
    const headerHorizontalPadding = 16;
    const headerGroup = model.getColumnHeaderGroup(modelColumn, depth);
    if (headerGroup?.isKeyColumnGroup === true) {
      //   let maxWidth = baseWidth;
      //   let parent: PivotColumnHeaderGroup | undefined = headerGroup;
      //   let depth = 0;
      //   while (parent != null) {
      //     const parentWidth = super.getHeaderTextWidth(
      //       context,
      //       parent.name,
      //       headerFont,
      //       headerHorizontalPadding,
      //       maxColumnWidth,
      //       parent,
      //       model
      //     );
      //     // log.debug('Checking parent group for key column:', parent, {
      //     //   maxWidth,
      //     //   parentWidth,
      //     // });
      //     maxWidth = Math.max(maxWidth, parentWidth);
      //     depth += 1;
      //     parent = model?.getColumnHeaderParentGroup(
      //       parent.childIndexes[0] as ModelIndex,
      //       depth
      //     );
      //   }
      //   log.debug(
      //     'Checking parent group for key column: FINAL:',
      //     maxWidth,
      //     maxWidth + 180 + headerHorizontalPadding
      //   );
      return baseWidth + 180 + headerHorizontalPadding;
    }
    return baseWidth;
  }
}

export default IrisGridPivotMetricCalculator;
