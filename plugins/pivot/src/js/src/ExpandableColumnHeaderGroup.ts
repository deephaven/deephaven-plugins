import { ColumnHeaderGroup } from '@deephaven/iris-grid';

// TODO: rename into PivotColumnHeaderGroup
export function isExpandableColumnHeaderGroup(
  group: unknown
): group is ExpandableColumnHeaderGroup {
  return group instanceof ExpandableColumnHeaderGroup;
}

export class ExpandableColumnHeaderGroup extends ColumnHeaderGroup {
  isExpanded: boolean;

  isExpandable: boolean;

  isTotalGroup?: boolean;

  isKeyColumnGroup?: boolean;

  displayName?: string;

  constructor({
    name,
    displayName,
    children,
    color,
    depth,
    childIndexes,
    parent,
    isExpanded = false,
    isExpandable = false,
    isTotalGroup = false,
    isKeyColumnGroup = false,
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
    isTotalGroup?: boolean;
    isKeyColumnGroup?: boolean;
  }) {
    super({
      name,
      children,
      color,
      depth,
      childIndexes,
      parent,
    });
    this.displayName = displayName;
    this.isExpanded = isExpanded;
    // isExpandable isn't necessarily the same as hasChildren
    // A group could have children but not be expandable (e.g. key column groups)
    this.isExpandable = isExpandable;
    this.isTotalGroup = isTotalGroup;
    this.isKeyColumnGroup = isKeyColumnGroup;
  }
}

export default ExpandableColumnHeaderGroup;
