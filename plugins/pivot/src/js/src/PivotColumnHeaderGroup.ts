import { ColumnHeaderGroup } from '@deephaven/iris-grid';

export function isPivotColumnHeaderGroup(
  group: unknown
): group is PivotColumnHeaderGroup {
  return group instanceof PivotColumnHeaderGroup;
}

export class PivotColumnHeaderGroup extends ColumnHeaderGroup {
  isExpanded: boolean;

  isExpandable: boolean;

  isTotalGroup: boolean;

  isKeyColumnGroup: boolean;

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

export default PivotColumnHeaderGroup;
