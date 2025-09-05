/* eslint-disable import/prefer-default-export */
import { ColumnHeaderGroup, DisplayColumn } from '@deephaven/iris-grid';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { type dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { assertNotNull } from '@deephaven/utils';

export const GRAND_TOTAL_GROUP_COLOR = '#211f22';
export const COLUMN_SOURCE_GROUP_COLOR = '#211f22';

export const GRAND_TOTAL_GROUP_NAME = 'Grand Totals';

export type SnapshotDimensionKeys = readonly (unknown | null)[];
export type SnapshotDimensionKeyMap = Map<number, SnapshotDimensionKeys>;

export function isCorePlusDh(
  dh: typeof DhType | typeof CorePlusDhType
): dh is typeof CorePlusDhType {
  return 'coreplus' in dh;
}

export type ExpandableDisplayColumn = DisplayColumn & {
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
};

export function makeColumn({
  name,
  displayName = name,
  type,
  index,
  description,
  isSortable = false,
  depth = 2,
  hasChildren = false,
  isExpanded = false,
}: {
  name: string;
  displayName?: string;
  type: string;
  index: number;
  description?: string;
  isSortable?: boolean;
  depth?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
}): ExpandableDisplayColumn {
  return {
    name,
    displayName,
    type,
    isPartitionColumn: false,
    isSortable,
    isProxy: false,
    description,
    index,
    depth,
    hasChildren,
    isExpanded,
    filter: () => {
      throw new Error('Filter not implemented for virtual column');
    },
    sort: () => {
      throw new Error('Sort not implemented for virtual column');
    },
    formatColor: () => {
      throw new Error('Color not implemented for virtual column');
    },
    get: () => {
      throw new Error('get not implemented for virtual column');
    },
    getFormat: () => {
      throw new Error('getFormat not implemented for virtual column');
    },
    formatNumber: () => {
      throw new Error('formatNumber not implemented for virtual column');
    },
    formatDate: () => {
      throw new Error('formatDate not implemented for virtual column');
    },
  };
}

export function makePlaceholderColumnName(
  index: number,
  valueSource: CorePlusDhType.coreplus.pivot.PivotSource
): string {
  return `__PLACEHOLDER_${index}/${valueSource.name}`;
}

export function makeGrandTotalColumnName(
  valueSource: CorePlusDhType.coreplus.pivot.PivotSource
): string {
  return `GRAND_TOTAL/${valueSource.name}`;
}

/**
 * Create a column name for the grid based on the pivot keys and depth
 */
// export function makeColumnName(
//   keys: SnapshotDimensionKeys,
//   depth: number
// ): string {
//   let name = '';
//   // Root level depth is 2
//   for (let i = 0; i < depth - 1; i += 1) {
//     if (i > 0) {
//       name += '/';
//     }
//     name += keys[i];
//   }
//   return `${name}`;
// }

export function makeColumnName(
  keys: SnapshotDimensionKeys,
  depth: number
): string {
  return `${keys
    .slice(0, depth + 1)
    .filter(k => k != null)
    .join('/')}`;
}

export function makeValueSourceColumnName(
  columnName: string,
  valueSource: CorePlusDhType.coreplus.pivot.PivotSource
): string {
  return `${columnName}/${valueSource.name}`;
}

export function makeTotalsGroupName(columnName: string): string {
  return `${columnName}/TOTALS`;
}

/**
 * Create a column with displayName property based on the dimension data
 * @param snapshotDim Snapshot dimension data
 * @param valueSource Value source data
 * @param originalIndex Original column index in the dimension
 * @param offset Offset to apply to the column index
 * @returns Column with the displayName
 */
export function makeExpandableDisplayColumn(
  snapshotDim: CorePlusDhType.coreplus.pivot.DimensionData,
  valueSource: CorePlusDhType.coreplus.pivot.PivotSource,
  originalIndex: number,
  offset: number
): ExpandableDisplayColumn {
  const keys = snapshotDim.getKeys(originalIndex);
  const depth = snapshotDim.getDepth(originalIndex);
  const hasChildren = snapshotDim.hasChildren(originalIndex);
  const isExpanded = snapshotDim.isExpanded(originalIndex);
  const name = makeValueSourceColumnName(
    makeColumnName(keys, depth),
    // depth === 2
    //   ? makeTotalsGroupName(makeColumnName(keys, depth))
    //   : makeColumnName(keys, depth),
    valueSource
  );
  const description = keys[depth - 2];
  const displayName = valueSource.name;
  return makeColumn({
    name,
    displayName,
    description,
    type: valueSource.type,
    index: originalIndex + offset,
    depth,
    isExpanded,
    hasChildren,
  });
}

/**
 * Create a placeholder column with displayName property based on the dimension data
 * @param valueSource Value source data
 * @param originalIndex Original column index in the dimension
 * @returns Column with the displayName
 */
export function makePlaceholderDisplayColumn(
  valueSource: CorePlusDhType.coreplus.pivot.PivotSource,
  originalIndex: number,
  offset: number
): ExpandableDisplayColumn {
  return makeColumn({
    name: makePlaceholderColumnName(originalIndex, valueSource),
    displayName: '',
    type: valueSource.type,
    index: originalIndex + offset,
    depth: 2, // Root depth
    isExpanded: false,
    hasChildren: false,
  });
}

/**
 * Create a column for a row source
 * @param source Row source to create the column for
 * @param index Column index
 * @returns Created column
 */
export function makeRowSourceColumn(
  source: CorePlusDhType.coreplus.pivot.PivotSource,
  index: number
): ExpandableDisplayColumn {
  const { name, type, isSortable } = source;
  return makeColumn({ name, type, index, isSortable });
}

/**
 * Check if two column arrays are different
 * @param prevColumns Previous columns
 * @param newColumns New columns
 * @returns True if the columns are different
 */
export function checkColumnsChanged(
  prevColumns: readonly DisplayColumn[],
  newColumns: readonly DisplayColumn[]
): boolean {
  return (
    prevColumns.length !== newColumns.length ||
    prevColumns.some((col, i) => col.name !== newColumns[i].name)
  );
}

export function makeColumnHeaderGroups(
  pivotTable: CorePlusDhType.coreplus.pivot.PivotTable,
  columns: readonly ExpandableDisplayColumn[],
  keyColumns: readonly ExpandableDisplayColumn[],
  totalsColumns: readonly ExpandableDisplayColumn[]
): readonly ColumnHeaderGroup[] {
  const childrenMap = new Map();
  let children: ExpandableDisplayColumn[] = [];
  // TODO:
  const virtualColumns = [...keyColumns, ...totalsColumns];
  let lastParent = virtualColumns.length;
  columns.slice(virtualColumns.length).forEach((c, index) => {
    if (index === 0 && c.depth !== 2) {
      throw new Error('First column should be a group column');
    }
    if (c.depth === 2) {
      children = [];
      lastParent = virtualColumns.length + index;
      childrenMap.set(lastParent, children);
    }
    children.push(c);
  });

  const reversedColumnSources = [...pivotTable.columnSources].reverse();

  const topLevelChildren = columns.slice(virtualColumns.length).map(
    c =>
      new ColumnHeaderGroup({
        name: c.depth === 2 ? makeTotalsGroupName(c.name) : c.name,
        displayName: c.depth === 2 ? `Totals` : c.displayName, // `${c.displayName} Totals` : c.displayName,
        color: c.depth === 2 ? COLUMN_SOURCE_GROUP_COLOR : undefined,
        children: [c.name],
        depth: 1,
        childIndexes: [columns.indexOf(c)],
      })
  );

  const headerGroups = [
    new ColumnHeaderGroup({
      name: reversedColumnSources[0].name,
      color: COLUMN_SOURCE_GROUP_COLOR,
      children: keyColumns.map(c => c.name),
      depth: 1,
      childIndexes: keyColumns.map((_, index) => index),
    }),
    new ColumnHeaderGroup({
      name: `__GRAND_TOTALS_${reversedColumnSources[0].name}`,
      displayName:
        reversedColumnSources.length === 1 ? GRAND_TOTAL_GROUP_NAME : '',
      color: GRAND_TOTAL_GROUP_COLOR,
      children: totalsColumns.map(c => c.name),
      depth: 1,
      childIndexes: totalsColumns.map((_, index) => index + keyColumns.length),
    }),

    ...topLevelChildren,

    // ...[...childrenMap.values()].map(
    //   ch =>
    //     new ColumnHeaderGroup({
    //       name: makeGroupName(ch[0].name),
    //       displayName: ch[0].displayName,
    //       children: ch.map((col, index) => col.name),
    //       depth: 1,
    //       childIndexes: ch.map(col => columns.indexOf(col)),
    //     })
    // ),

    // new ColumnHeaderGroup({
    //   name: 'group2',
    //   children: columns.slice(this.virtualColumns.length).map(c => c.name),
    //   depth: 1,
    //   childIndexes: columns
    //     .slice(this.virtualColumns.length)
    //     .map((_, index) => index + this.virtualColumns.length),
    // }),
  ];

  if (reversedColumnSources.length > 1) {
    reversedColumnSources.slice(1).forEach((source, i) => {
      // i already has the offset
      const childName = reversedColumnSources[i].name;
      const parents: ColumnHeaderGroup[] = [
        new ColumnHeaderGroup({
          name: source.name,
          color: COLUMN_SOURCE_GROUP_COLOR,
          children: [childName],
          // TODO: depth based on the forEach index
          depth: 2,
          // same childIndexes as in the parent group
          childIndexes: keyColumns.map((_, index) => index),
        }),
      ];
      // Add parent to existing children in the headerGroups array
      headerGroups.find(hg => hg.name === childName)?.setParent(source.name);

      headerGroups.push(...parents);

      const totalsParent = new ColumnHeaderGroup({
        name: `__GRAND_TOTALS_${source.name}`,
        displayName:
          i === reversedColumnSources.length - 2 ? GRAND_TOTAL_GROUP_NAME : '',
        color: GRAND_TOTAL_GROUP_COLOR,
        children: [`__GRAND_TOTALS_${childName}`],
        depth: 2,
        childIndexes: totalsColumns.map(
          (_, index) => index + keyColumns.length
        ),
      });

      headerGroups
        .find(hg => hg.name === `__GRAND_TOTALS_${childName}`)
        ?.setParent(`__GRAND_TOTALS_${source.name}`);

      headerGroups.push(totalsParent);

      // const filteredHeaderChildren = [...childrenMap.values()].filter(
      //   // ch => ch.depth === 1
      //   () => true
      // );
      // console.log('filteredHeaderChildren', filteredHeaderChildren);
      // const headerChildren = filteredHeaderChildren.map(
      //   ch =>
      //     new ColumnHeaderGroup({
      //       name: makeGroupName(ch[0].name),
      //       displayName: ch[0].displayName,
      //       children: ch.map((col, index) => col.name),
      //       depth: 2,
      //       childIndexes: ch.map(col => columns.indexOf(col)),
      //     })
      // );

      // headerChildren.forEach(ch => {

      // });

      // headerGroups.push(...headerChildren);

      // const headerChildren = [...childrenMap.values()].map(
      //   ch =>
      //     new ColumnHeaderGroup({
      //       name: makeGroupName(ch[0].name),
      //       displayName: ch[0].displayName,
      //       children: ch.map((col, index) => col.name),
      //       depth: 2,
      //       childIndexes: ch.map(col => columns.indexOf(col)),
      //     })
      // );

      [...childrenMap.values()].forEach(value => {
        const [parent, ...parentChildren] = value;
        // console.log('p,c', parent, parentChildren);

        const childrenNames = [
          makeTotalsGroupName(parent.name),
          ...parentChildren.map(col => col.name),
        ];

        const parentGroup = new ColumnHeaderGroup({
          name: parent.name,
          displayName: parent.displayName,
          children: childrenNames,
          depth: 2,
          childIndexes: [
            columns.indexOf(parent),
            ...parentChildren.map(col => columns.indexOf(col)),
          ],
        });

        // Loop over children and update parent to current parent id

        headerGroups.forEach(hg => {
          if (childrenNames.includes(hg.name)) {
            hg.setParent(parentGroup.name);
          }
        });

        headerGroups.push(parentGroup);

        // if (ch.depth === 2) {
        //   headerGroups.push(
        //     new ColumnHeaderGroup({
        //       name: makeGroupName(ch[0].name),
        //       displayName: ch[0].displayName,
        //       children: ch.map((col, index) => col.name),
        //       depth: 1,
        //       childIndexes: ch.map(col => columns.indexOf(col)),
        //     })
        //   );
        // }
      });

      // headerGroups.push(...headerChildren);
    });
  }
  return headerGroups;
}

function addColumnGroup(
  columnGroups: Map<string, ColumnHeaderGroup>,
  groupName: string,
  depth: number,
  valueSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[]
): void {
  if (depth > 1) {
    const totalsGroup = new ColumnHeaderGroup({
      name: groupName, // makeTotalsGroupName(groupName),
      displayName: 'Totals',
      children: [],
      depth: depth - 1,
      childIndexes: [],
      parent: groupName,
    });
    columnGroups.set(totalsGroup.name, totalsGroup);
  }
  if (!columnGroups.has(groupName)) {
    const group = new ColumnHeaderGroup({
      name: groupName,
      displayName: groupName,
      children: [],
      depth,
      childIndexes: [],
    });
    columnGroups.set(group.name, group);
  }
  const group = columnGroups.get(groupName);
  assertNotNull(group);

  // if (depth > 1) {
  //   group.addChildren([groupName]); // ([makeTotalsGroupName(groupName)]);
  // }
  if (depth > 1) {
    // Update totals group to have all value sources as children
    const children = valueSources.map(source =>
      // makeValueSourceColumnName(makeTotalsGroupName(groupName), source)
      makeValueSourceColumnName(groupName, source)
    );
    // const totalsGroup = columnGroups.get(makeTotalsGroupName(groupName));
    const totalsGroup = columnGroups.get(groupName);
    assertNotNull(totalsGroup);
    totalsGroup.addChildren(children);
  } else if (depth === 1) {
    // Leaf nodes should have value sources as children
    const children = valueSources.map(source =>
      makeValueSourceColumnName(groupName, source)
    );
    group.addChildren(children);
  }
}

export function keyMapToColumnGroups(
  keyMap: SnapshotDimensionKeyMap,
  valueSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[]
): Map<string, ColumnHeaderGroup> {
  const columnGroups = new Map<string, ColumnHeaderGroup>();
  keyMap.forEach((keys, colIndex) => {
    for (let k = 0; k < keys.length && keys[k] != null; k += 1) {
      const keyName = makeColumnName(keys, k);
      const parentName = k > 0 ? makeColumnName(keys, k - 1) : null;
      // console.log('gr', columnGroups, {
      //   k,
      //   keys,
      //   keyName,
      //   parentName,
      // });
      if (parentName == null) {
        // Top level group
        addColumnGroup(columnGroups, keyName, keys.length, valueSources);
      } else {
        addColumnGroup(columnGroups, keyName, keys.length - k, valueSources);
        const parentGroup = columnGroups.get(parentName);
        const group = columnGroups.get(keyName);
        assertNotNull(parentGroup);
        assertNotNull(group);
        parentGroup.addChildren([group.name]);
        group.setParent(parentName);
      }
    }
  });
  return columnGroups;
}

export function getColumnGroups(
  pivotTable: CorePlusDhType.coreplus.pivot.PivotTable,
  columns: readonly ExpandableDisplayColumn[],
  keyColumns: readonly ExpandableDisplayColumn[],
  totalsColumns: readonly ExpandableDisplayColumn[],
  snapshotColumns: CorePlusDhType.coreplus.pivot.DimensionData | null
): ColumnHeaderGroup[] {
  const result = [];
  const maxDepth = pivotTable.columnSources.length;
  // Key column groups
  const keyColumnNames = keyColumns.map(c => c.name);
  for (let i = pivotTable.columnSources.length - 1; i >= 0; i -= 1) {
    const source = pivotTable.columnSources[i];
    const group = new ColumnHeaderGroup({
      name: source.name,
      displayName: source.name,
      children:
        i === pivotTable.columnSources.length - 1
          ? keyColumnNames
          : [pivotTable.columnSources[i + 1].name],
      depth: maxDepth - i,
      childIndexes: [],
    });
    result.push(group);
  }

  // Grand total group
  for (let i = pivotTable.columnSources.length - 1; i >= 0; i -= 1) {
    const source = pivotTable.columnSources[i];
    const group = new ColumnHeaderGroup({
      name: `__GRAND_TOTALS/${source.name}`,
      displayName: i === 0 ? GRAND_TOTAL_GROUP_NAME : '',
      color: GRAND_TOTAL_GROUP_COLOR,
      children:
        i === pivotTable.columnSources.length - 1
          ? totalsColumns.map(c => c.name)
          : [`__GRAND_TOTALS/${pivotTable.columnSources[i + 1].name}`],
      depth: maxDepth - i,
      childIndexes: [],
    });
    result.push(group);
  }

  if (snapshotColumns == null) {
    return result;
  }

  // Data columns
  const groupMap = new Map<string, ColumnHeaderGroup>();
  const dataColumns = columns.slice(keyColumns.length + totalsColumns.length);

  for (let c = 0; c < dataColumns.length; c += pivotTable.valueSources.length) {
    const dimensionIndex = Math.floor(c / pivotTable.valueSources.length);
    const inViewport =
      dimensionIndex >= snapshotColumns.offset &&
      dimensionIndex < snapshotColumns.offset + snapshotColumns.count;

    console.log('[0] dataColumns', dataColumns, dimensionIndex, inViewport);

    if (!inViewport) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const keys = snapshotColumns.getKeys(dimensionIndex);
    const depth = snapshotColumns.getDepth(dimensionIndex);
    const children = pivotTable.valueSources.map(source =>
      makeValueSourceColumnName(makeColumnName(keys, depth - 1), source)
    );
    for (let i = pivotTable.columnSources.length - 1; i >= 0; i -= 1) {
      // Join keys, replace nulls with the current source name
      const name = keys
        .slice(0, i + 1)
        .map((k, index) =>
          k == null ? pivotTable.columnSources[index].name : k
        )
        .join('/');
      const isTotalsGroup = keys[i] == null;
      const parentKey = i > 0 ? keys[i - 1] : null;
      const totalsGroupName = parentKey == null ? '' : `${parentKey} Total`;
      const group =
        groupMap.get(name) ??
        new ColumnHeaderGroup({
          name,
          displayName: isTotalsGroup ? totalsGroupName : name,
          color: isTotalsGroup ? COLUMN_SOURCE_GROUP_COLOR : undefined,
          children: [],
          depth: maxDepth - i,
          childIndexes: [],
        });
      group.addChildren(
        i === pivotTable.columnSources.length - 1
          ? children
          : [
              keys
                .slice(0, i + 2)
                .map((k, index) =>
                  k == null ? pivotTable.columnSources[index].name : k
                )
                .join('/'),
            ]
      );
      groupMap.set(name, group);
    }
  }
  result.push(...groupMap.values());
  return result;
}
