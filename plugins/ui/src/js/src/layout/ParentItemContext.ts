import { createContext, useContext, useRef } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import type { ContentItem } from '@deephaven/golden-layout';

export const ParentItemContext = createContext<ContentItem | null>(null);

export function useParentItem() {
  const layoutManager = useLayoutManager();
  const parentContextItem = useContext(ParentItemContext);
  const parentItem = useRef(
    parentContextItem ??
      layoutManager.root.contentItems[0] ??
      layoutManager.root
  );
  return parentItem.current;
}
