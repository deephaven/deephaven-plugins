/* eslint-disable import/prefer-default-export */
import { ColumnHeaderGroup, DisplayColumn } from '@deephaven/iris-grid';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { type dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';

export function isCorePlusDh(
  dh: typeof DhType | typeof CorePlusDhType
): dh is typeof CorePlusDhType {
  return 'coreplus' in dh;
}

export const COLUMN_SOURCE_GROUP_COLOR = '#211f22';
export const TOTALS_GROUP_COLOR = '#211f22';
export const GRAND_TOTALS_GROUP_NAME = 'Grand Totals';

export type SnapshotDimensionKeys = readonly (unknown | null)[];
export type SnapshotDimensionKeyMap = Map<number, SnapshotDimensionKeys>;

export type ExpandableDisplayColumn = DisplayColumn & {
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
};

class ExpandableColumnHeaderGroup extends ColumnHeaderGroup {
  isExpanded: boolean;

  isExpandable: boolean;

  constructor({
    name,
    displayName,
    children,
    color,
    depth,
    childIndexes,
    parent,
    isExpanded,
    isExpandable,
  }: {
    name: string;
    displayName?: string;
    children: string[];
    color?: string | null;
    depth: number;
    childIndexes: number[];
    parent?: string;
    isExpanded?: boolean;
    isExpandable?: boolean;
  }) {
    super({
      name,
      displayName,
      children,
      color,
      depth,
      childIndexes,
      parent,
    });
    this.isExpanded = isExpanded ?? false;
    // isExpandable isn't necessarily the same as hasChildren
    // A group could have children but not be expandable (e.g. key column groups)
    this.isExpandable = isExpandable ?? false;
  }
}

/**
 * Create a an ExpandableDisplayColumn object
 */
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

/** Create a placeholder column name based on the value source and index
 * @param index Index of the placeholder column
 * @param valueSource Value source
 * @returns Placeholder column name
 */
export function makePlaceholderColumnName(
  index: number,
  valueSource: CorePlusDhType.coreplus.pivot.PivotSource
): string {
  return `__PLACEHOLDER${index}/${valueSource.name}`;
}

/**
 * Create a grand total column name based on the value source
 * @param valueSource Value source
 * @returns Grand total column name
 */
export function makeGrandTotalColumnName(
  valueSource: CorePlusDhType.coreplus.pivot.PivotSource
): string {
  return `__GRAND_TOTAL/${valueSource.name}`;
}

/**
 * Create a column name for the grid based on the pivot dimension keys and depth
 */
export function makeColumnName(
  keys: SnapshotDimensionKeys,
  depth: number
): string {
  return `${keys
    .slice(0, depth + 1)
    .filter(k => k != null)
    .join('/')}`;
}

/**
 * Create a column name for a value source under a column group
 * @param columnName Column name
 * @param valueSource Value source
 * @returns Column name for the value source
 */
export function makeValueSourceColumnName(
  columnName: string,
  valueSource: CorePlusDhType.coreplus.pivot.PivotSource
): string {
  return `${columnName}/${valueSource.name}`;
}

/**
 * Create a name for a totals group under a column group
 * @param columnName Column name
 * @returns Totals group name
 */
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

/**
 * Create column groups for the pivot table columns
 * @param pivotTable Pivot table
 * @param columns Column definitions
 * @param keyColumns Key columns
 * @param totalsColumns Totals columns
 * @param snapshotColumns Snapshot columns
 * @returns Column groups
 */
export function getColumnGroups(
  pivotTable: CorePlusDhType.coreplus.pivot.PivotTable,
  columns: readonly ExpandableDisplayColumn[],
  keyColumns: readonly ExpandableDisplayColumn[],
  totalsColumns: readonly ExpandableDisplayColumn[],
  snapshotColumns: CorePlusDhType.coreplus.pivot.DimensionData | null
): ExpandableColumnHeaderGroup[] {
  // TODO: make sure group names are unique and can't collide with pivot keys
  const result = [];
  const maxDepth = pivotTable.columnSources.length;
  // Key column groups
  const keyColumnNames = keyColumns.map(c => c.name);
  for (let i = pivotTable.columnSources.length - 1; i >= 0; i -= 1) {
    const source = pivotTable.columnSources[i];
    const group = new ExpandableColumnHeaderGroup({
      name: source.name,
      displayName: source.name,
      children:
        i === pivotTable.columnSources.length - 1
          ? keyColumnNames
          : [pivotTable.columnSources[i + 1].name],
      depth: maxDepth - i,
      childIndexes: [],
      color: COLUMN_SOURCE_GROUP_COLOR,
      isExpandable: false,
    });
    result.push(group);
  }

  // Grand total group
  for (let i = pivotTable.columnSources.length - 1; i >= 0; i -= 1) {
    const source = pivotTable.columnSources[i];
    const group = new ExpandableColumnHeaderGroup({
      name: makeGrandTotalColumnName(source),
      displayName: i === 0 ? GRAND_TOTALS_GROUP_NAME : '',
      color: TOTALS_GROUP_COLOR,
      children:
        i === pivotTable.columnSources.length - 1
          ? totalsColumns.map(c => c.name)
          : [makeGrandTotalColumnName(pivotTable.columnSources[i + 1])],
      depth: maxDepth - i,
      childIndexes: [],
      isExpandable: false,
    });
    result.push(group);
  }

  if (snapshotColumns == null) {
    return result;
  }

  // Data columns
  const groupMap = new Map<string, ExpandableColumnHeaderGroup>();
  const dataColumns = columns.slice(keyColumns.length + totalsColumns.length);

  for (let c = 0; c < dataColumns.length; c += pivotTable.valueSources.length) {
    const dimensionIndex = Math.floor(c / pivotTable.valueSources.length);
    const inViewport =
      dimensionIndex >= snapshotColumns.offset &&
      dimensionIndex < snapshotColumns.offset + snapshotColumns.count;
    if (!inViewport) {
      // No need to add groups for columns that are not in the viewport
      // eslint-disable-next-line no-continue
      continue;
    }
    const keys = snapshotColumns.getKeys(dimensionIndex);
    const depth = snapshotColumns.getDepth(dimensionIndex);
    const isExpanded = snapshotColumns.isExpanded(dimensionIndex);
    const children = pivotTable.valueSources.map(source =>
      makeValueSourceColumnName(makeColumnName(keys, depth - 1), source)
    );
    for (let i = pivotTable.columnSources.length - 1; i >= 0; i -= 1) {
      // Join keys, replace nulls with source name for the current level
      const name = keys
        .slice(0, i + 1)
        .map((k, index) =>
          k == null ? pivotTable.columnSources[index].name : k
        )
        .join('/');
      const isTotalsGroup = keys[i] == null;
      const parentKey = i > 0 ? keys[i - 1] : null;
      const totalsGroupDisplayName = parentKey == null ? '' : 'Total';
      const group =
        groupMap.get(name) ??
        new ExpandableColumnHeaderGroup({
          name,
          displayName: isTotalsGroup ? totalsGroupDisplayName : keys[i],
          color: isTotalsGroup ? TOTALS_GROUP_COLOR : undefined,
          children: [],
          depth: maxDepth - i,
          childIndexes: [],
          isExpanded: isTotalsGroup ? true : isExpanded,
          isExpandable: !isTotalsGroup,
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
