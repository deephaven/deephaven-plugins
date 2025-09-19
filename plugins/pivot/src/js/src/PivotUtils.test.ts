import { type dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { TestUtils } from '@deephaven/test-utils';
import {
  GRAND_TOTALS_GROUP_NAME,
  getColumnGroups,
  ROOT_DEPTH,
} from './PivotUtils';
import IrisGridPivotTheme from './IrisGridPivotTheme';

const { createMockProxy } = TestUtils;

describe('getColumnGroups', () => {
  const mockValueSource =
    createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'Value1',
      type: 'int',
    });

  const mockColumnSource =
    createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'Column1',
      type: 'string',
    });

  const mockRowSources = [
    createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'Row1',
      type: 'string',
    }),
    createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'Row2',
      type: 'string',
    }),
  ];

  const mockPivotTable =
    createMockProxy<CorePlusDhType.coreplus.pivot.PivotTable>({
      columnSources: [mockColumnSource],
      rowSources: [...mockRowSources],
      valueSources: [mockValueSource],
    });

  const mockSnapshotColumns =
    createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
      offset: 0,
      count: 1,
      totalCount: 1,
      getKeys: jest.fn().mockReturnValue(['Key1']),
      getDepth: jest.fn().mockReturnValue(ROOT_DEPTH),
      isExpanded: jest.fn().mockReturnValue(true),
    });

  it('should create key column and grand total groups', () => {
    const result = getColumnGroups(mockPivotTable, null);
    expect(result).toHaveLength(2);
    const keyGroup = result[0];
    expect(keyGroup).toEqual(
      expect.objectContaining({
        name: 'Column1',
        displayName: 'Column1',
        color: IrisGridPivotTheme.columnSourceHeaderBackground,
        children: ['Row1', 'Row2'],
        isExpandable: false,
      })
    );
    const totalGroup = result[1];
    expect(totalGroup).toEqual(
      expect.objectContaining({
        name: '__GRAND_TOTAL/Column1',
        displayName: GRAND_TOTALS_GROUP_NAME,
        color: IrisGridPivotTheme.totalsHeaderBackground,
        children: ['__GRAND_TOTAL/Value1'],
        isExpandable: false,
      })
    );
  });

  it('create data column groups based on snapshot columns', () => {
    const result = getColumnGroups(mockPivotTable, mockSnapshotColumns);

    expect(result.length).toBe(3);

    expect(result).toContainEqual(
      expect.objectContaining({
        name: 'Key1',
        children: ['Key1/Value1'],
        isExpandable: false,
        isExpanded: true,
      })
    );
  });

  it('should handle empty column sources', () => {
    const emptyPivotTable =
      createMockProxy<CorePlusDhType.coreplus.pivot.PivotTable>({
        valueSources: [mockValueSource],
        rowSources: [],
        columnSources: [],
      });

    const result = getColumnGroups(emptyPivotTable, null);

    expect(result).toHaveLength(0);
  });

  it('should handle empty value sources', () => {
    const noValuesPivotTable = {
      ...mockPivotTable,
      valueSources: [],
    } as unknown as CorePlusDhType.coreplus.pivot.PivotTable;

    const result = getColumnGroups(noValuesPivotTable, null);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
