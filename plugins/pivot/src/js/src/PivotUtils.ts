/* eslint-disable import/prefer-default-export */
import type { DisplayColumn } from '@deephaven/iris-grid';

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
    isProxy: false, // true, // TODO?
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
