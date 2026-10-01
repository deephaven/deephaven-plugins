import { createContext, useContext } from 'react';
import { EMPTY_ARRAY } from '@deephaven/utils';

/** Key paths of the keyed layout elements around a panel, outermost first */
export const PanelKeyScopeContext =
  createContext<readonly string[]>(EMPTY_ARRAY);

export function usePanelKeyScope(): readonly string[] {
  return useContext(PanelKeyScopeContext);
}

/**
 * Serialize the key that identifies a panel within its panel manager.
 * @param scope Key paths of the keyed layout elements around the panel
 * @param keyPath The panel's own key path
 * @returns The serialized key, or undefined if the panel isn't keyed
 */
export function getPanelKey(
  scope: readonly string[],
  keyPath: readonly string[] = EMPTY_ARRAY
): string | undefined {
  if (keyPath.length === 0) {
    return undefined;
  }
  return JSON.stringify([...scope, ...keyPath]);
}

export default PanelKeyScopeContext;
