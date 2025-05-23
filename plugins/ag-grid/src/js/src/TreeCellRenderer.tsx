import React, { useCallback } from 'react';
import { CustomCellRendererProps } from '@ag-grid-community/react';
import { Button } from '@deephaven/components';
import { vsTriangleDown, vsTriangleRight } from '@deephaven/icons';
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
    <>
      {hasChildren && (
        <Button
          icon={isExpanded ? vsTriangleDown : vsTriangleRight}
          kind="ghost"
          tooltip={isExpanded ? 'Collapse' : 'Expand'}
          onClick={handleClick}
          style={{
            width: 'calc(100% - 5px)',
            height: '100%',
            margin: 0,
            paddingTop: 0,
            paddingBottom: 0,
            paddingRight: 0,
            paddingLeft: depth * 10,
            textAlign: 'left',
            justifyContent: 'left',
          }}
        />
      )}
      &nbsp;
      {value}
    </>
  );
}
