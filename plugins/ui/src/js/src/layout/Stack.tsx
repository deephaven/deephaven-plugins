import React, { useEffect, useState } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { Stack as StackType } from '@deephaven/golden-layout';
import type { StackElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';

function Stack({
  children,
  height,
  width,
  activeItemIndex,
}: StackElementProps): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const parent = useParentItem();
  const [stack] = useState<StackType>(() => {
    const newStack = layoutManager.createContentItem(
      {
        type: 'stack',
        height,
        width,
        activeItemIndex,
      },
      parent
    );

    parent.addChild(newStack, undefined, true);

    return newStack as StackType;
  });

  useEffect(() => {
    stack.setSize();

    parent.setSize();

    if (activeItemIndex != null) {
      stack.setActiveContentItem(stack.contentItems[activeItemIndex]);
    }
  }, [activeItemIndex, parent, stack]);

  useEffect(
    () => () => {
      stack.remove();
    },
    [stack]
  );

  return (
    <ParentItemContext.Provider value={stack}>
      {children}
    </ParentItemContext.Provider>
  );
}

export default Stack;
