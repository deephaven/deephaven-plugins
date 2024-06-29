import {
  EventHandlerResult,
  GridMouseHandler,
  GridPoint,
  isExpandableGridModel,
} from '@deephaven/grid';
import { IrisGridModel, RowIndex } from '@deephaven/iris-grid';
import {
  CellData,
  ColumnIndex,
  RowDataMap,
  UITableProps,
} from './UITableUtils';

function getCellData(
  columnIndex: ColumnIndex,
  rowIndex: RowIndex,
  model: IrisGridModel
): CellData {
  const column = model.columns[columnIndex];
  const { type } = column;
  const value = model.valueForCell(columnIndex, rowIndex);
  const text = model.textForCell(columnIndex, rowIndex);
  return {
    value,
    text,
    type,
  };
}

/**
 * Get the data map for the given row
 * @param rowIndex Row to get the data map for
 * @returns Data map for the row
 */
function getRowDataMap(rowIndex: RowIndex, model: IrisGridModel): RowDataMap {
  const { columns, groupedColumns } = model;
  const dataMap: RowDataMap = {};
  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i];
    const { name } = column;
    const isExpandable =
      isExpandableGridModel(model) && model.isRowExpandable(rowIndex);
    const isGrouped = groupedColumns.find(c => c.name === name) != null;
    const cellData = getCellData(i, rowIndex, model);
    // If the cellData.value is undefined, that means we don't have any data for that column (i.e. the column is not visible), don't send it back
    if (cellData.value !== undefined) {
      dataMap[name] = {
        ...cellData,
        isGrouped,
        isExpandable,
      };
    }
  }
  return dataMap;
}

/**
 * Mouse handler for UITable. Will call the appropriate callbacks when a cell, row, or column is clicked or double clicked with the data structure expected.
 */
class UITableMouseHandler extends GridMouseHandler {
  private model: IrisGridModel;

  private onCellPress: UITableProps['onCellPress'];

  private onCellDoublePress: UITableProps['onCellDoublePress'];

  private onColumnPress: UITableProps['onColumnPress'];

  private onColumnDoublePress: UITableProps['onColumnDoublePress'];

  private onRowPress: UITableProps['onRowPress'];

  private onRowDoublePress: UITableProps['onRowDoublePress'];

  constructor(
    model: IrisGridModel,
    onCellPress: UITableProps['onCellPress'],
    onCellDoublePress: UITableProps['onCellDoublePress'],
    onColumnPress: UITableProps['onColumnPress'],
    onColumnDoublePress: UITableProps['onColumnDoublePress'],
    onRowPress: UITableProps['onRowPress'],
    onRowDoublePress: UITableProps['onRowDoublePress']
  ) {
    super(890);
    this.model = model;
    this.onCellPress = onCellPress;
    this.onCellDoublePress = onCellDoublePress;
    this.onColumnPress = onColumnPress;
    this.onColumnDoublePress = onColumnDoublePress;
    this.onRowPress = onRowPress;
    this.onRowDoublePress = onRowDoublePress;
  }

  onClick(gridPoint: GridPoint): EventHandlerResult {
    const { column, row } = gridPoint;
    const { model, onCellPress, onRowPress, onColumnPress } = this;

    if (onCellPress != null && column != null && row != null) {
      const cellData = getCellData(column, row, model);
      onCellPress(cellData);
    }
    if (onRowPress != null && row != null) {
      const rowData = getRowDataMap(row, model);
      onRowPress(rowData);
    }
    if (onColumnPress && column != null) {
      onColumnPress(model.columns[column].name);
    }
    return false;
  }

  onDoubleClick(gridPoint: GridPoint): EventHandlerResult {
    const { column, row } = gridPoint;
    const { model, onCellDoublePress, onRowDoublePress, onColumnDoublePress } =
      this;

    if (onCellDoublePress != null && column != null && row != null) {
      const cellData = getCellData(column, row, model);
      onCellDoublePress(cellData);
    }
    if (onRowDoublePress != null && row != null) {
      const rowData = getRowDataMap(row, model);
      onRowDoublePress(rowData);
    }
    if (onColumnDoublePress && column != null) {
      onColumnDoublePress(model.columns[column].name);
    }
    return false;
  }
}

export default UITableMouseHandler;
