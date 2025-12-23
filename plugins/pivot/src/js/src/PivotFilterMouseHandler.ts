/* eslint class-methods-use-this: "off" */
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
} from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import { getColumnSourceHeaderFromGridPoint } from './PivotMouseHandlerUtils';

const log = Log.module('@deephaven/js-plugin-pivot/PivotFilterMouseHandler');

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

    log.debug('onDown', gridPoint, sourceIndex);

    if (sourceIndex != null) {
      if (!metrics) throw new Error('Metrics not set');

      const theme = this.irisGrid.getTheme();

      if (
        isFilterBarShown &&
        theme.columnHeaderHeight != null &&
        theme.filterBarHeight != null
        // TODO: check X and Y within the filter input box based on metrics
      ) {
        this.irisGrid.focusFilterBar(sourceIndex);
        return true;
      }
    }

    return false;
  }
}

export default PivotFilterMouseHandler;
