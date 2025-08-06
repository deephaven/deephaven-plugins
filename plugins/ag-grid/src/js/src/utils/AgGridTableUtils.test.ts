import type { dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { convertColumnToColDef, getSideBar } from './AgGridTableUtils';

const mockTable = TestUtils.createMockProxy<DhType.Table>({
  expand: undefined,
  collapse: undefined,
});
const mockTreeTable = TestUtils.createMockProxy<DhType.TreeTable>({
  expand: jest.fn(),
  collapse: jest.fn(),
});

describe('getSideBar', () => {
  it('returns the correct sidebar definition for a Table', () => {
    const sideBar = getSideBar(mockTable);
    expect(sideBar).toEqual({
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressRowGroups: false,
            suppressValues: false,
            suppressPivots: true,
          },
        },
      ],
    });
  });

  it('returns the correct sidebar definition for a TreeTable', () => {
    const sideBar = getSideBar(mockTreeTable);
    expect(sideBar).toEqual({
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressRowGroups: true,
            suppressValues: true,
            suppressPivots: true,
          },
        },
      ],
    });
  });
});

describe('convertColumnToColDef', () => {
  it.each([
    ['boolean', { cellDataType: 'boolean', filter: true, cellRenderer: null }],
    [
      'char',
      {
        cellDataType: 'char',
        filter: 'agNumberColumnFilter',
        filterParams: {
          buttons: ['reset', 'apply'],
          allowedCharPattern: 'a-zA-Z',
          numberParser: expect.any(Function),
          numberFormatter: expect.any(Function),
        },
      },
    ],
    ['string', { cellDataType: 'string', filter: true }],
    [
      'decimal',
      {
        cellDataType: 'decimal',
        filter: 'agNumberColumnFilter',
        cellStyle: expect.any(Function),
      },
    ],
    [
      'int',
      {
        cellDataType: 'int',
        filter: 'agNumberColumnFilter',
        cellStyle: expect.any(Function),
      },
    ],
  ])('converts a %s column to a ColDef', (type, expected) => {
    const column = TestUtils.createMockProxy<DhType.Column>({
      name: 'Test Column',
      type,
    });
    const colDef = convertColumnToColDef(column);
    expect(colDef).toEqual({
      ...expected,
    });
  });
});
