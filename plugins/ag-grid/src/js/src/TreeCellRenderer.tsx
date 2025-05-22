import React, { useCallback, useEffect } from 'react';
import { AgEventType, RowEvent } from '@ag-grid-community/core';
import { CustomCellRendererProps } from '@ag-grid-community/react';
import { Button } from '@deephaven/components';
import { vsCollapseAll, vsExpandAll } from '@deephaven/icons';
import Log from '@deephaven/log';
import TreeViewportDatasource, {
  TREE_NODE_KEY,
  TreeNode,
} from './datasources/TreeViewportRowDataSource';

const log = Log.module('@deephaven/js-plugin-ag-grid/TreeCellRenderer');

export type TreeCellRendererProps = CustomCellRendererProps & {
  datasource: TreeViewportDatasource;
};

export default function TreeCellRenderer(
  props: TreeCellRendererProps
): JSX.Element {
  const { node, value, datasource } = props;

  useEffect(() => {
    const expandListener = (event: RowEvent<AgEventType, unknown, unknown>) => {
      if (event.node.rowIndex != null) {
        log.debug('Expanding row', event.node.rowIndex);
        datasource.setExpanded(event.node.rowIndex ?? 0, event.node.expanded);
      }
    };

    node.addEventListener('expandedChanged', expandListener);

    return () => {
      node.removeEventListener('expandedChanged', expandListener);
    };
  }, [datasource, node]);

  const handleClick = useCallback(
    () => node.setExpanded(!node.expanded),
    [node]
  );
  const { data } = node;
  const treeNode: TreeNode | undefined = data?.[TREE_NODE_KEY];
  const { hasChildren = false, depth = 0, isExpanded = false } = treeNode ?? {};

  return (
    <div
      style={{
        paddingLeft: `${node.level * 15}px`,
      }}
    >
      {hasChildren && (
        <Button
          icon={node.expanded ? vsCollapseAll : vsExpandAll}
          kind="ghost"
          tooltip={node.expanded ? 'Collapse' : 'Expand'}
          onClick={handleClick}
        />
      )}
      &nbsp;
      {value}
    </div>
  );
}
