import { IrisGridMetricCalculator } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import type PivotColumnHeaderGroup from './PivotColumnHeaderGroup';
import type IrisGridPivotModel from './IrisGridPivotModel';

const log = Log.module(
  '@deephaven/js-plugin-pivot/IrisGridPivotMetricCalculator'
);

class IrisGridPivotMetricCalculator extends IrisGridMetricCalculator {
  //   override calculateTextWidth(
  //     context: CanvasRenderingContext2D,
  //     font: string,
  //     text: string,
  //     maxWidth?: number
  //   ): number {
  //     // Customize text width calculation if needed
  //     log.debug('Calculating text width for:', { text, font });
  //     return super.calculateTextWidth(context, font, text, maxWidth);
  //   }

  getHeaderTextWidth(
    context: CanvasRenderingContext2D,
    headerText: string | undefined,
    headerFont: string,
    headerHorizontalPadding: number,
    maxColumnWidth: number,
    headerGroup: PivotColumnHeaderGroup | undefined,
    model: IrisGridPivotModel | undefined
  ): number {
    const baseWidth = super.getHeaderTextWidth(
      context,
      headerText,
      headerFont,
      headerHorizontalPadding,
      maxColumnWidth,
      headerGroup,
      model
    );
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
