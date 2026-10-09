import React, { useMemo } from 'react';
import { PanelKeyScopeContext, usePanelKeyScope } from './PanelKeyScopeContext';

type PanelKeyScopeProps = React.PropsWithChildren<{
  /** Key of the layout element, added to the scope of the panels inside it */
  elementKey?: string;
}>;

/**
 * Adds a layout element's key to the scope of the panels inside it.
 */
export function PanelKeyScope({
  elementKey,
  children,
}: PanelKeyScopeProps): JSX.Element {
  const parentScope = usePanelKeyScope();
  const scope = useMemo(
    () => (elementKey == null ? parentScope : [...parentScope, elementKey]),
    [parentScope, elementKey]
  );

  return (
    <PanelKeyScopeContext.Provider value={scope}>
      {children}
    </PanelKeyScopeContext.Provider>
  );
}

export default PanelKeyScope;
