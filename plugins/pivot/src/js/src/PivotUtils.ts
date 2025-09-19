/* eslint-disable import/prefer-default-export */
import { DisplayColumn } from '@deephaven/iris-grid';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { type dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import ExpandableColumnHeaderGroup from './ExpandableColumnHeaderGroup';

export function isCorePlusDh(
  dh: typeof DhType | typeof CorePlusDhType
): dh is typeof CorePlusDhType {
  return 'coreplus' in dh;
}

export const GRAND_TOTALS_GROUP_NAME = 'Grand Total';
export const TOTALS_GROUP_NAME = 'Total';
export const ROOT_DEPTH = 2;

export type SnapshotDimensionKeys = readonly (unknown | null)[];
export type SnapshotDimensionKeyMap = Map<number, SnapshotDimensionKeys>;

export type ExpandableDisplayColumn = DisplayColumn & {
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
};

// TODO: move to TextUtils
/**
 * Pluralize a string based on a value
 * @param value The value to use for pluralization
 * @param singular The singular form of the string
 * @param pluralized The pluralized form of the word. If not provided, will just append `s` to the `singular` form when pluralized.
 * @returns The pluralized string
 */
export function pluralize(
  value: number,
  singular: string,
  pluralized?: string
): string {
  if (value === 1) {
    return singular;
  }
  return pluralized != null ? pluralized : `${singular}s`;
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
  depth = ROOT_DEPTH,
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
    // filter: (...args) => {
    //   console.log('filter args:', args);
    //   throw new Error('Filter not implemented for virtual column');
    // },
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
  return keys
    .slice(0, depth + 1)
    .filter(k => k != null)
    .join('/');
}

/**
 * Get the column group name for a specific depth
 * @param keys Column keys
 * @param columnSources Column sources
 * @param depth Column depth
 * @returns Column group name
 */
export function makeColumnGroupName(
  keys: SnapshotDimensionKeys,
  columnSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[],
  depth: number
): string {
  return keys
    .slice(0, depth + 1)
    .map((k, i) => (k == null ? columnSources[i].name : k))
    .join('/');
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
  const { description } = valueSource;
  const name = makeValueSourceColumnName(
    makeColumnName(keys, depth),
    valueSource
  );
  // const description = keys[depth - 2];
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
    depth: ROOT_DEPTH,
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
  const { name, type, isSortable, description } = source;
  return makeColumn({ name, type, index, isSortable, description });
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

export function getKeyColumnGroups(
  columnSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[],
  rowSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[]
): ExpandableColumnHeaderGroup[] {
  const groups =
    columnSources.length === 0
      ? [
          new ExpandableColumnHeaderGroup({
            // TODO:
            name: '__All',
            displayName: '',
            // TODO: what if rowSources is empty?
            children: rowSources.map(c => c.name),
            childIndexes: [],
            // color: IrisGridPivotTheme.columnSourceHeaderBackground,
            isKeyColumnGroup: true,
            depth: 1,
            isExpandable: false,
          }),
        ]
      : columnSources.map(
          (source, i) =>
            new ExpandableColumnHeaderGroup({
              name: source.name,
              displayName: source.name,
              children:
                i === columnSources.length - 1
                  ? rowSources.map(c => c.name)
                  : [columnSources[i + 1].name],
              childIndexes: [],
              // color: IrisGridPivotTheme.columnSourceHeaderBackground,
              isKeyColumnGroup: true,
              depth: columnSources.length - i,
              isExpandable: false,
            })
        );
  return rowSources.length === 0
    ? // Edge case: the UI doesn't have a place for key column groups if there are no row sources
      []
    : groups;
}

export function getTotalsColumnGroups(
  columnSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[],
  valueSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[],
  isRootColumnExpanded: boolean
): ExpandableColumnHeaderGroup[] {
  const groupName = pluralize(valueSources.length, GRAND_TOTALS_GROUP_NAME);
  return columnSources.length === 0
    ? [
        new ExpandableColumnHeaderGroup({
          // TODO:
          name: 'TMP__GrandTotals',
          displayName: groupName,
          children: valueSources.map(v => makeGrandTotalColumnName(v)),
          childIndexes: [],
          color: undefined,
          depth: 1,
          // Only the top level is expandable
          // TODO:
          // isExpandable: i === 0,
          // isExpanded: isRootColumnExpanded,
        }),
      ]
    : columnSources.map(
        (source, i) =>
          new ExpandableColumnHeaderGroup({
            name: makeGrandTotalColumnName(source),
            displayName: i === 0 ? groupName : '',
            children:
              i === columnSources.length - 1
                ? valueSources.map(v => makeGrandTotalColumnName(v))
                : [makeGrandTotalColumnName(columnSources[i + 1])],
            childIndexes: [],
            // color: IrisGridPivotTheme.totalsHeaderBackground,
            isTotalGroup: true,
            depth: columnSources.length - i,
            // Only the top level is expandable
            isExpandable: i === 0,
            isExpanded: isRootColumnExpanded,
          })
      );
}

export function getSnapshotColumnGroups(
  snapshotColumns: CorePlusDhType.coreplus.pivot.DimensionData,
  columnSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[],
  valueSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[],
  formatValue: (value: unknown, type: string) => string
): ExpandableColumnHeaderGroup[] {
  // Even with no column sources we need one level of grouping for the value sources
  const maxDepth = Math.max(columnSources.length, 1);
  const groupMap = new Map<string, ExpandableColumnHeaderGroup>();
  const groupName = pluralize(valueSources.length, TOTALS_GROUP_NAME);
  for (
    let c = snapshotColumns.offset;
    c < snapshotColumns.offset + snapshotColumns.count;
    c += 1
  ) {
    const keys = snapshotColumns.getKeys(c);
    const depth = snapshotColumns.getDepth(c);
    const isExpanded = snapshotColumns.isExpanded(c);
    columnSources.forEach((_, i) => {
      // Join keys, replace nulls with the source name for the current level
      const name = makeColumnGroupName(keys, columnSources, i);
      const isTotalGroup = keys[i] == null;
      const parentKey = i > 0 ? keys[i - 1] : null;
      const totalsGroupDisplayName = parentKey == null ? '' : groupName;
      const group =
        groupMap.get(name) ??
        new ExpandableColumnHeaderGroup({
          name,
          displayName: isTotalGroup ? totalsGroupDisplayName : keys[i],
          // color: isTotalGroup
          //   ? IrisGridPivotTheme.totalsHeaderBackground
          //   : undefined,
          isTotalGroup,
          children: [],
          depth: maxDepth - i,
          childIndexes: [],
          isExpanded: isTotalGroup ? true : isExpanded,
          // Totals and groups containing value sources are not expandable
          isExpandable: !isTotalGroup && maxDepth - i > 1,
        });
      group.addChildren(
        i === columnSources.length - 1
          ? // The last group contains all value source columns
            valueSources.map(v =>
              makeValueSourceColumnName(makeColumnName(keys, depth - 1), v)
            )
          : // Add the next group in the hierarchy as a child
            [makeColumnGroupName(keys, columnSources, i + 1)]
      );
      groupMap.set(name, group);
    });
  }
  return [...groupMap.values()];
}

/**
 * Create column groups for the pivot table columns
 * @param pivotTable Pivot table
 * @param snapshotColumns Snapshot columns
 * @returns Column groups
 */
export function getColumnGroups(
  pivotTable: CorePlusDhType.coreplus.pivot.PivotTable,
  snapshotColumns: CorePlusDhType.coreplus.pivot.DimensionData | null,
  formatValue: (value: unknown, type: string) => string,
  isRootColumnExpanded: boolean
): ExpandableColumnHeaderGroup[] {
  const virtualColumnGroups = [
    ...getKeyColumnGroups(pivotTable.columnSources, pivotTable.rowSources),
    ...getTotalsColumnGroups(
      pivotTable.columnSources,
      pivotTable.valueSources,
      isRootColumnExpanded
    ),
  ];

  const snapshotColumnGroups =
    snapshotColumns == null
      ? []
      : getSnapshotColumnGroups(
          snapshotColumns,
          pivotTable.columnSources,
          pivotTable.valueSources,
          formatValue
        );

  // TODO: make sure group names are unique and can't collide with pivot keys
  return [...virtualColumnGroups, ...snapshotColumnGroups];
}
