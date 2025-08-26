import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { TestUtils } from '@deephaven/test-utils';
import { ColDef } from '@ag-grid-community/core';
import { getPivotResultColumns } from './AgGridPivotUtils';

const TOTALS_COLUMN_DEF = {
  headerName: 'Totals',
  field: 'Totals',
  colId: 'Totals',
};

function makePendingColDef(groupId: string): ColDef {
  return {
    headerName: '...',
    field: `${groupId}/...`,
    colId: `${groupId}/...`,
    columnGroupShow: 'open',
  };
}

function makePivotGroupTotalColDef(
  groupId: string,
  headerName = groupId
): ColDef {
  return {
    headerName: `${headerName} Total`,
    field: groupId,
    colId: groupId,
  };
}

describe('getPivotResultColumns', () => {
  it('should only add the totals column if there are no columns in the DimensionData', () => {
    const columns =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        count: 0,
      });

    const result = getPivotResultColumns(columns);
    expect(result).toEqual([TOTALS_COLUMN_DEF]);
  });

  it('should handle one level of columns with nothing expanded yet', () => {
    const columns =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        count: 3,
        offset: 0,
        getKeys: (index: number) => [`C${index}`],
        hasChildren: () => true,
      });

    const result = getPivotResultColumns(columns);
    expect(result).toEqual([
      {
        headerName: 'C0',
        groupId: 'C0',
        columnGroupShow: 'open',
        children: [makePendingColDef('C0'), makePivotGroupTotalColDef('C0')],
        context: { snapshotIndex: 0 },
      },
      {
        headerName: 'C1',
        groupId: 'C1',
        columnGroupShow: 'open',
        children: [makePendingColDef('C1'), makePivotGroupTotalColDef('C1')],
        context: { snapshotIndex: 1 },
      },
      {
        headerName: 'C2',
        groupId: 'C2',
        columnGroupShow: 'open',
        children: [makePendingColDef('C2'), makePivotGroupTotalColDef('C2')],
        context: { snapshotIndex: 2 },
      },
      TOTALS_COLUMN_DEF,
    ]);
  });

  it('should handle one level of columns with one expanded', () => {
    const groupKeys = [
      ['C0', null],
      ['C0', 'C0.1'],
      ['C1', null],
    ];
    const columns =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        count: groupKeys.length,
        offset: 0,
        getKeys: (index: number) => groupKeys[index],
        hasChildren: (index: number) => groupKeys[index][1] == null,
      });

    const result = getPivotResultColumns(columns);
    expect(result).toEqual([
      {
        headerName: 'C0',
        groupId: 'C0',
        columnGroupShow: 'open',
        children: [
          {
            headerName: 'C0.1',
            field: 'C0/C0.1',
            colId: 'C0/C0.1',
            columnGroupShow: 'open',
          },
          makePivotGroupTotalColDef('C0'),
        ],
        context: { snapshotIndex: 0 },
      },
      {
        headerName: 'C1',
        groupId: 'C1',
        columnGroupShow: 'open',
        children: [makePendingColDef('C1'), makePivotGroupTotalColDef('C1')],
        context: { snapshotIndex: 2 },
      },
      TOTALS_COLUMN_DEF,
    ]);
  });

  it('should handle multiple levels of columns with some expanded', () => {
    const groupKeys = [
      ['C0', null, null],
      ['C1', null, null],
      ['C1', 'C1.1', null],
      ['C1', 'C1.1', 'C1.1.1'],
      ['C1', 'C1.1', 'C1.1.2'],
      ['C1', 'C1.2', null],
      ['C2', null, null],
      ['C2', 'C2.1', null],
      ['C2', 'C2.2', null],
    ];

    const columns =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        count: groupKeys.length,
        offset: 0,
        getKeys: (index: number) => groupKeys[index],
        hasChildren: (index: number) => groupKeys[index][2] == null,
      });

    const result = getPivotResultColumns(columns);
    expect(result).toEqual([
      {
        headerName: 'C0',
        groupId: 'C0',
        columnGroupShow: 'open',
        children: [makePendingColDef('C0'), makePivotGroupTotalColDef('C0')],
        context: { snapshotIndex: 0 },
      },
      {
        headerName: 'C1',
        groupId: 'C1',
        columnGroupShow: 'open',
        children: [
          {
            headerName: 'C1.1',
            groupId: 'C1/C1.1',
            columnGroupShow: 'open',
            context: { snapshotIndex: 2 },
            children: [
              {
                headerName: 'C1.1.1',
                field: 'C1/C1.1/C1.1.1',
                colId: 'C1/C1.1/C1.1.1',
                columnGroupShow: 'open',
              },
              {
                headerName: 'C1.1.2',
                field: 'C1/C1.1/C1.1.2',
                colId: 'C1/C1.1/C1.1.2',
                columnGroupShow: 'open',
              },
              makePivotGroupTotalColDef('C1/C1.1', 'C1.1'),
            ],
          },
          {
            headerName: 'C1.2',
            groupId: 'C1/C1.2',
            columnGroupShow: 'open',
            children: [
              makePendingColDef('C1/C1.2'),
              makePivotGroupTotalColDef('C1/C1.2', 'C1.2'),
            ],
            context: { snapshotIndex: 5 },
          },
          makePivotGroupTotalColDef('C1'),
        ],
        context: { snapshotIndex: 1 },
      },
      {
        headerName: 'C2',
        groupId: 'C2',
        columnGroupShow: 'open',
        children: [
          {
            headerName: 'C2.1',
            groupId: 'C2/C2.1',
            columnGroupShow: 'open',
            context: { snapshotIndex: 7 },
            children: [
              makePendingColDef('C2/C2.1'),
              makePivotGroupTotalColDef('C2/C2.1', 'C2.1'),
            ],
          },
          {
            headerName: 'C2.2',
            groupId: 'C2/C2.2',
            columnGroupShow: 'open',
            context: { snapshotIndex: 8 },
            children: [
              makePendingColDef('C2/C2.2'),
              makePivotGroupTotalColDef('C2/C2.2', 'C2.2'),
            ],
          },
          makePivotGroupTotalColDef('C2'),
        ],
        context: { snapshotIndex: 6 },
      },
      TOTALS_COLUMN_DEF,
    ]);
  });
});
