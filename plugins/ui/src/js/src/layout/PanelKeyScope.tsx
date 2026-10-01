import React, { useMemo } from 'react';
import { EMPTY_ARRAY } from '@deephaven/utils';
import { PanelKeyScopeContext, usePanelKeyScope } from './PanelKeyScopeContext';

type PanelKeyScopeProps = React.PropsWithChildren<{
  /** Key path of the layout element, added to the scope of the panels inside it */
  keyPath?: readonly string[];
}>;

/**
 * Adds a layout element's key path to the scope of the panels inside it.
 */
export function PanelKeyScope({
  keyPath = EMPTY_ARRAY,
  children,
}: PanelKeyScopeProps): JSX.Element {
  const parentScope = usePanelKeyScope();
  // A new array is passed on every document render, so compare by value
  const keyPathString = JSON.stringify(keyPath);
  const scope = useMemo(() => {
    const path: string[] = JSON.parse(keyPathString);
    return path.length > 0 ? [...parentScope, ...path] : parentScope;
  }, [parentScope, keyPathString]);

  return (
    <PanelKeyScopeContext.Provider value={scope}>
      {children}
    </PanelKeyScopeContext.Provider>
  );
}

export default PanelKeyScope;
