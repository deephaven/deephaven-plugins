import { ColumnHeaderGroup } from '@deephaven/iris-grid';

export function isExpandableColumnHeaderGroup(
  group: unknown
): group is ExpandableColumnHeaderGroup {
  return group instanceof ExpandableColumnHeaderGroup;
}

export class ExpandableColumnHeaderGroup extends ColumnHeaderGroup {
  isExpanded: boolean;

  isExpandable: boolean;

  displayName?: string;

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
      children,
      color,
      depth,
      childIndexes,
      parent,
    });
    this.displayName = displayName;
    this.isExpanded = isExpanded ?? false;
    // isExpandable isn't necessarily the same as hasChildren
    // A group could have children but not be expandable (e.g. key column groups)
    this.isExpandable = isExpandable ?? false;
  }
}

export default ExpandableColumnHeaderGroup;
