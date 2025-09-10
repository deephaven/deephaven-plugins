import React, { useCallback } from 'react';
import classNames from 'classnames';
import { CustomCellRendererProps } from '@ag-grid-community/react';
import { TREE_NODE_KEY, TreeNode } from '../utils/AgGridTableUtils';
import DeephavenViewportDatasource from '../datasources/DeephavenViewportDatasource';

export type TreeCellRendererProps = CustomCellRendererProps & {
  datasource: DeephavenViewportDatasource;
};

export function TreeCellRenderer(props: TreeCellRendererProps): JSX.Element {
  const { node, datasource, api } = props;
  const { data } = node;
  const treeNode: TreeNode | undefined = data?.[TREE_NODE_KEY];
  const { hasChildren = false, depth = 0, isExpanded = false } = treeNode ?? {};

  const handleClick = useCallback(() => {
    if (treeNode != null && datasource instanceof DeephavenViewportDatasource) {
      datasource.setExpanded(treeNode.index, !treeNode.isExpanded);
    }
  }, [datasource, treeNode]);

  const rowGroupColumns = api.getRowGroupColumns();
  // If we're on a leaf row, show the last row group column as the group name instead of an empty string.
  const colDef =
    rowGroupColumns[hasChildren ? depth - 2 : rowGroupColumns.length - 1];
  const colId = colDef?.getId();
  const groupName = data?.[colId];

  // This mimics the structure of the default AG Grid group cell renderer... wish we could just provide the groups/depth information to AG Grid directly, but this seems to be the only way.
  const indentLevel = Math.max(0, depth - 1);
  return (
    <span
      className={classNames(
        'ag-cell-wrapper',
        { 'ag-cell-expandable': hasChildren },
        hasChildren ? 'ag-row-group' : 'ag-row-group-leaf-indent'
      )}
      style={{ '--ag-indentation-level': indentLevel } as React.CSSProperties}
    >
      {hasChildren && (
        <>
          <span
            className={classNames('ag-group-expanded', {
              'ag-hidden': !isExpanded,
            })}
          >
            <span
              className="ag-icon ag-icon-tree-open"
              role="presentation"
              onClick={handleClick}
            />
          </span>
          <span
            className={classNames('ag-group-contracted', {
              'ag-hidden': isExpanded,
            })}
          >
            <span
              className="ag-icon ag-icon-tree-closed"
              role="presentation"
              onClick={handleClick}
            />
          </span>
        </>
      )}
      <span className="ag-group-value">{groupName}</span>
    </span>
  );
}

export default TreeCellRenderer;
