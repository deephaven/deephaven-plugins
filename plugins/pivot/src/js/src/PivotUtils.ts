/* eslint-disable import/prefer-default-export */
import type { DisplayColumn } from '@deephaven/iris-grid';
import { type dh as DhType } from '@deephaven-enterprise/jsapi-coreplus-types';

export type ExpandableDisplayColumn = DisplayColumn & {
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
};

export function makeVirtualColumn({
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

export function makePlaceholderColumnName(index: number): string {
  return `__PLACEHOLDER_${index}`;
}

export function makeGrandTotalColumnName(index: number): string {
  return `__GRAND_TOTAL_${index}`;
}

/**
 * Create a unique column name for the grid based on the pivot keys and depth
 */
export function makeUniqueColumnName(
  keys: (string | null)[],
  depth: number
): string {
  let name = '';
  // Root level depth is 2
  for (let i = 0; i < depth - 1; i += 1) {
    if (i > 0) {
      name += '_';
    }
    name += keys[i];
  }
  name = `__${name}`;
  return name;
}

/**
 * Create a unique group name for the given column name
 * @param columnName The column name
 * @returns The unique group name
 */
export function makeUniqueGroupName(columnName: string): string {
  return `__GROUP_${columnName}`;
}

/**
 * Create a column with displayName property based on the dimension data
 * @param snapshotDim Snapshot dimension data
 * @param valueSource Value source data
 * @param originalIndex Original column index in the dimension
 * @param offset Offset to apply to the column index
 * @param displayNameOverride Optional display name override
 * @returns Column with the displayName
 */
export function createExpandableDisplayColumn(
  snapshotDim: DhType.coreplus.pivot.DimensionData,
  valueSource: DhType.coreplus.pivot.PivotSource,
  originalIndex: number,
  offset: number,
  displayNameOverride?: string
): ExpandableDisplayColumn {
  const keys = snapshotDim.getKeys(originalIndex);
  const depth = snapshotDim.getDepth(originalIndex);
  const hasChildren = snapshotDim.hasChildren(originalIndex);
  const isExpanded = snapshotDim.isExpanded(originalIndex);
  const name = makeUniqueColumnName(keys, depth);

  let displayName = keys[depth - 2];

  if (hasChildren) {
    if (isExpanded) {
      displayName = `▼ ${displayName}`;
    } else {
      displayName = `► ${displayName}`;
    }
  }

  return makeVirtualColumn({
    name,
    displayName: displayNameOverride ?? displayName,
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
export function createPlaceholderDisplayColumn(
  valueSource: DhType.coreplus.pivot.PivotSource,
  originalIndex: number,
  offset: number
): ExpandableDisplayColumn {
  return makeVirtualColumn({
    name: makePlaceholderColumnName(originalIndex),
    displayName: '',
    type: valueSource.type,
    index: originalIndex + offset,
    // TODO: confirm correct default depth?
    depth: 2,
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
export function createRowSourceColumn(
  source: DhType.coreplus.pivot.PivotSource,
  index: number
): ExpandableDisplayColumn {
  const { name, type, isSortable } = source;
  return makeVirtualColumn({ name, type, index, isSortable });
}
