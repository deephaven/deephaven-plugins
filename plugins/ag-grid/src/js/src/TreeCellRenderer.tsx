import React, { useCallback } from 'react';
import { CustomCellRendererProps } from '@ag-grid-community/react';
import { Button } from '@deephaven/components';
import { vsChevronDown, vsChevronRight } from '@deephaven/icons';
import TreeViewportDatasource, {
  TREE_NODE_KEY,
  TreeNode,
} from './datasources/TreeViewportRowDataSource';

export type TreeCellRendererProps = CustomCellRendererProps & {
  datasource: TreeViewportDatasource;
};

export default function TreeCellRenderer(
  props: TreeCellRendererProps
): JSX.Element {
  const { node, value, datasource } = props;
  const { data } = node;
  const treeNode: TreeNode | undefined = data?.[TREE_NODE_KEY];
  const { hasChildren = false, depth = 0, isExpanded = false } = treeNode ?? {};

  const handleClick = useCallback(() => {
    if (treeNode != null) {
      datasource.setExpanded(treeNode.index, !treeNode.isExpanded);
    }
  }, [datasource, treeNode]);

  return (
    <div
      style={{
        paddingLeft: `${depth * 15}px`,
      }}
    >
      {hasChildren && (
        <Button
          icon={isExpanded ? vsChevronDown : vsChevronRight}
          kind="ghost"
          tooltip={isExpanded ? 'Collapse' : 'Expand'}
          onClick={handleClick}
          style={{ height: 20 }}
        />
      )}
      &nbsp;
      {value}
    </div>
  );
}
