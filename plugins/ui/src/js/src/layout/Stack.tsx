import React, { useEffect, useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { Stack as StackType, RowOrColumn } from '@deephaven/golden-layout';
import { normalizeStackChildren, type StackElementProps } from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import { useInitialLayoutConfig } from './InitialLayoutConfigContext';

function Stack({
  children,
  height,
  width,
  activeItemIndex,
}: StackElementProps): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const parent = useParentItem();
  const initialLayoutConfig = useInitialLayoutConfig();

  const stack = useMemo(() => {
    const newStack = layoutManager.createContentItem(
      {
        type: 'stack',
        height,
        width,
        activeItemIndex,
      },
      parent
    );

    // The 3rd param prevents golden-layout from calling setSize
    // until we've mounted all of the rows and columns
    (parent as RowOrColumn).addChild(newStack, undefined, true);

    return newStack as StackType;
  }, [layoutManager, parent, height, width, activeItemIndex]);

  useEffect(() => {
    if (activeItemIndex != null) {
      stack.setActiveContentItem(stack.contentItems[activeItemIndex]);
    }
  }, [activeItemIndex, parent, stack]);

  if (initialLayoutConfig != null) {
    // If there's already an initial layout defined, user has likely already customized their layout.
    // Don't add a row here
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  const normalizedChildren = normalizeStackChildren(children);

  return (
    <ParentItemContext.Provider value={stack}>
      {normalizedChildren}
    </ParentItemContext.Provider>
  );
}

export default Stack;
