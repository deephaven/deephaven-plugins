import { ContextActionUtils } from '@deephaven/components';
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
  type GridMouseEvent,
  type Grid,
} from '@deephaven/grid';
import { IrisGridType as IrisGrid } from '@deephaven/iris-grid';
import { assertNotNull } from '@deephaven/utils';
import Log from '@deephaven/log';
import { getColumnSourceHeaderFromGridPoint } from './PivotMouseHandlerUtils';

const log = Log.module('@deephaven/js-plugin-pivot/PivotSortMouseHandler');

/**
 * Trigger sorting on column source click.
 * Column sources are represented as negative column indexes.
 */
class PivotSortMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.columnSource = null;
    this.irisGrid = irisGrid;
  }

  columnSource: number | null;

  irisGrid: IrisGrid;

  // We need to remember where the down started, because the canvas element will trigger a click where mouseUp is
  onDown(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    const { model } = this.irisGrid.props;
    assertNotNull(model);
    this.columnSource = getColumnSourceHeaderFromGridPoint(model, gridPoint);
    log.debug('onDown', gridPoint, this.columnSource);
    return false;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    const { model } = this.irisGrid.props;
    assertNotNull(model);
    const columnSource = getColumnSourceHeaderFromGridPoint(model, gridPoint);
    if (
      columnSource != null &&
      columnSource === this.columnSource &&
      model.isColumnSortable(columnSource)
    ) {
      const addToExisting = ContextActionUtils.isModifierKeyDown(event);
      this.irisGrid.toggleSort(columnSource, addToExisting);
      return true;
    }

    return false;
  }
}

export default PivotSortMouseHandler;
