import {
  CellClassParams,
  CellStyle,
  DataTypeDefinition,
} from 'ag-grid-community';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import { AgGridCellColors } from './AgGridColors';

export class AgGridFormatter {
  private formatter: Formatter;

  constructor(formatter: Formatter) {
    this.formatter = formatter;
  }

  // Override pre-defined AG Grid data types/create new ones to match Deephaven types
  cellDataTypeDefinitions: { [cellDataType: string]: DataTypeDefinition } = {
    [TableUtils.dataType.BOOLEAN]: {
      extendsDataType: 'boolean',
      baseDataType: 'boolean',
      valueFormatter: params =>
        this.formatter.getFormattedString(
          params.value,
          TableUtils.dataType.BOOLEAN,
          params.colDef.field
        ),
    },
    [TableUtils.dataType.CHAR]: {
      extendsDataType: 'text',
      baseDataType: 'text',
      valueFormatter: params =>
        this.formatter.getFormattedString(
          params.value,
          TableUtils.dataType.CHAR,
          params.colDef.field
        ),
    },
    [TableUtils.dataType.DATETIME]: {
      extendsDataType: 'dateString',
      baseDataType: 'dateString',
      valueFormatter: params =>
        this.formatter.getFormattedString(
          params.value,
          TableUtils.dataType.DATETIME,
          params.colDef.field
        ),
    },
    [TableUtils.dataType.DECIMAL]: {
      extendsDataType: 'number',
      baseDataType: 'number',
      valueFormatter: params =>
        this.formatter.getFormattedString(
          params.value,
          TableUtils.dataType.DECIMAL,
          params.colDef.field
        ),
    },
    [TableUtils.dataType.INT]: {
      extendsDataType: 'number',
      baseDataType: 'number',
      valueFormatter: params =>
        this.formatter.getFormattedString(
          params.value,
          TableUtils.dataType.INT,
          params.colDef.field
        ),
    },
    [TableUtils.dataType.STRING]: {
      extendsDataType: 'text',
      baseDataType: 'text',
      valueFormatter: params =>
        this.formatter.getFormattedString(
          params.value,
          TableUtils.dataType.STRING,
          params.colDef.field
        ),
    },
    [TableUtils.dataType.UNKNOWN]: {
      extendsDataType: 'text',
      baseDataType: 'text',
      valueFormatter: params =>
        this.formatter.getFormattedString(
          params.value,
          TableUtils.dataType.UNKNOWN,
          params.colDef.field
        ),
    },
  };

  static styleForNumberCell(params: CellClassParams): CellStyle {
    if ((params.value as number) > 0) {
      return {
        textAlign: 'right',
        color: AgGridCellColors.numberPositive,
      };
    }
    if ((params.value as number) < 0) {
      return {
        textAlign: 'right',
        color: AgGridCellColors.numberNegative,
      };
    }
    return { textAlign: 'right', color: AgGridCellColors.numberZero };
  }

  static styleForDateCell(params: CellClassParams): CellStyle {
    return { textAlign: 'center', color: AgGridCellColors.date };
  }
}

export default AgGridFormatter;
