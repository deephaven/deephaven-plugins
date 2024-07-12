import { GridPoint, ModelIndex } from '@deephaven/grid';
import type { ResolvableContextAction } from '@deephaven/components';
import {
  IrisGridModel,
  IrisGridType,
  IrisGridContextMenuHandler,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { UITableProps, wrapContextActions } from './UITableUtils';

/**
 * Context menu handler for UITable.
 */
class UITableContextMenuHandler extends IrisGridContextMenuHandler {
  private model: IrisGridModel;

  private contextMenuItems: UITableProps['contextMenu'];

  private contextColumnHeaderItems: UITableProps['contextHeaderMenu'];

  constructor(
    dh: typeof DhType,
    irisGrid: IrisGridType,
    model: IrisGridModel,
    contextMenuItems: UITableProps['contextMenu'],
    contextColumnHeaderItems: UITableProps['contextHeaderMenu']
  ) {
    super(irisGrid, dh);
    this.order -= 1; // Make it just above the default handler priority
    this.irisGrid = irisGrid;
    this.model = model;
    this.contextMenuItems = contextMenuItems;
    this.contextColumnHeaderItems = contextColumnHeaderItems;
  }

  getHeaderActions(
    modelIndex: ModelIndex,
    gridPoint: GridPoint
  ): ResolvableContextAction[] {
    const { irisGrid, contextColumnHeaderItems, model } = this;

    const { column: columnIndex } = gridPoint;
    const modelColumn = irisGrid.getModelColumn(columnIndex);

    if (!contextColumnHeaderItems || modelColumn == null) {
      return super.getHeaderActions(modelIndex, gridPoint);
    }

    const { columns } = model;

    const sourceCell = model.sourceForCell(modelColumn, 0);
    const { column: sourceColumn } = sourceCell;
    const column = columns[sourceColumn];

    return [
      ...super.getHeaderActions(modelIndex, gridPoint),
      ...wrapContextActions(contextColumnHeaderItems, {
        value: null,
        valueText: null,
        rowIndex: null,
        columnIndex: sourceColumn,
        column,
      }),
    ];
  }
}

export default UITableContextMenuHandler;
