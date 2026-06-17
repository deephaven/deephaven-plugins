import { type dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { TestUtils } from '@deephaven/test-utils';
import {
  GRAND_TOTALS_GROUP_NAME,
  makeColumnGroups,
  makeSnapshotColumnGroups,
  NULL_KEY_TOKEN,
  ROOT_DEPTH,
  TOTALS_GROUP_NAME,
} from './PivotUtils';

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

  it('creates key column and grand total groups', () => {
    const result = makeColumnGroups(mockPivotTable, null);
    expect(result).toHaveLength(2);
    const keyGroup = result[0];
    expect(keyGroup).toEqual(
      expect.objectContaining({
        name: 'Column1',
        displayName: 'Column1',
        children: ['Row1', 'Row2'],
        isExpandable: false,
      })
    );
    const totalGroup = result[1];
    expect(totalGroup).toEqual(
      expect.objectContaining({
        name: '__GRAND_TOTAL/Column1',
        displayName: GRAND_TOTALS_GROUP_NAME,
        children: ['__GRAND_TOTAL/Value1'],
        isExpandable: true,
      })
    );
  });

  it('create data column groups based on snapshot columns', () => {
    const result = makeColumnGroups(mockPivotTable, mockSnapshotColumns);

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

  it('distinguishes a real null key from a rollup total placeholder', () => {
    // Two column sources (e.g. Level, AuthenticatedUser) where the second
    // source contains a real null value. The "INFO" rollup total and the
    // "INFO + null AuthenticatedUser" leaf both carry the key array
    // ['INFO', null] and used to collapse to the same name, producing a
    // duplicate grid column.
    const levelSource =
      createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
        name: 'Level',
        type: 'string',
      });
    const userSource =
      createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
        name: 'AuthenticatedUser',
        type: 'string',
      });
    const valueSource =
      createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
        name: 'Timestamp',
        type: 'long',
      });

    // c0: INFO rollup total (depth 2), c1: INFO + null user leaf (depth 3),
    // c2: INFO + "iris" user leaf (depth 3)
    const keysByIndex = [
      ['INFO', null],
      ['INFO', null],
      ['INFO', 'iris'],
    ];
    const depthByIndex = [2, 3, 3];
    const expandedByIndex = [true, false, false];

    const snapshotColumns =
      createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        offset: 0,
        count: 3,
        totalCount: 3,
        getKeys: jest.fn((i: number) => keysByIndex[i]),
        getDepth: jest.fn((i: number) => depthByIndex[i]),
        isExpanded: jest.fn((i: number) => expandedByIndex[i]),
      });

    const result = makeSnapshotColumnGroups(
      snapshotColumns,
      [levelSource, userSource],
      [valueSource]
    );

    // The INFO total leaf and the null-user leaf must resolve to distinct
    // value columns.
    expect(result).toContainEqual(
      expect.objectContaining({
        name: 'INFO/AuthenticatedUser',
        isTotalGroup: true,
        displayName: TOTALS_GROUP_NAME,
        children: ['INFO/Timestamp'],
      })
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        name: `INFO/${NULL_KEY_TOKEN}`,
        isTotalGroup: false,
        children: [`INFO/${NULL_KEY_TOKEN}/Timestamp`],
      })
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        name: 'INFO/iris',
        isTotalGroup: false,
        displayName: 'iris',
        children: ['INFO/iris/Timestamp'],
      })
    );

    // The top-level INFO group references all three distinct child groups.
    expect(result).toContainEqual(
      expect.objectContaining({
        name: 'INFO',
        children: [
          'INFO/AuthenticatedUser',
          `INFO/${NULL_KEY_TOKEN}`,
          'INFO/iris',
        ],
      })
    );

    // No duplicate leaf value column names across all groups.
    const leafNames = result.flatMap(g =>
      g.children.filter(c => c.endsWith('/Timestamp'))
    );
    expect(new Set(leafNames).size).toBe(leafNames.length);
  });
});
