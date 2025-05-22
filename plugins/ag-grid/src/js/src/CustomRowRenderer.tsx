import React, { useCallback, useEffect, useState } from 'react';
import { RowEvent } from '@ag-grid-community/core';
import { CustomCellRendererProps } from '@ag-grid-community/react';

// import { RowEvent } from '@ag-grid-community/core';
// import { CustomCellRendererProps } from 'ag-grid-react';

export default function CustomRowRenderer(
  props: CustomCellRendererProps
): JSX.Element {
  const { node, value } = props;
  const [expanded, setExpanded] = useState(node.expanded);
  console.log('xxx node', node, 'value', value);

  useEffect(() => {
    const expandListener = (event: RowEvent) =>
      setExpanded(event.node.expanded);

    node.addEventListener('expandedChanged', expandListener);

    return () => {
      node.removeEventListener('expandedChanged', expandListener);
    };
  }, [node]);

  const onClick = useCallback(() => node.setExpanded(!node.expanded), [node]);

  return (
    <div
      style={{
        paddingLeft: `${node.level * 15}px`,
      }}
    >
      {node.group && (
        <div
          style={{
            cursor: 'pointer',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
          onClick={onClick}
        >
          &rarr;
        </div>
      )}
      &nbsp;
      {value}
    </div>
  );
}
