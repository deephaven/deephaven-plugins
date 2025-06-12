import React, { useCallback } from 'react';
import { CustomCellRendererProps } from '@ag-grid-community/react';
import { Button } from '@deephaven/components';
import { vsTriangleDown, vsTriangleRight } from '@deephaven/icons';
import TreeViewportDatasource, {
  TREE_NODE_KEY,
  TreeNode,
} from './datasources/TreeViewportDatasource';
import DeephavenViewportDatasource from './datasources/DeephavenViewportDatasource';

export type TreeCellRendererProps = CustomCellRendererProps & {
  datasource: DeephavenViewportDatasource;
};

export default function TreeCellRenderer(
  props: TreeCellRendererProps
): JSX.Element {
  const { node, datasource, api } = props;
  const { data } = node;
  const treeNode: TreeNode | undefined = data?.[TREE_NODE_KEY];
  const { hasChildren = false, depth = 0, isExpanded = false } = treeNode ?? {};

  const handleClick = useCallback(() => {
    const { currentDatasource } = datasource;
    if (
      treeNode != null &&
      currentDatasource instanceof TreeViewportDatasource
    ) {
      currentDatasource.setExpanded(treeNode.index, !treeNode.isExpanded);
    }
  }, [datasource, treeNode]);

  const rowGroupColumns = api.getRowGroupColumns();
  // If we're on a leaf row, show the last row group column as the group name instead of an empty string.
  const colDef =
    rowGroupColumns[hasChildren ? depth - 2 : rowGroupColumns.length - 1];
  const colId = colDef?.getId();
  const groupName = data?.[colId];

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
        >
          {groupName}
        </Button>
      )}
      {!hasChildren && groupName}
    </>
  );
}
