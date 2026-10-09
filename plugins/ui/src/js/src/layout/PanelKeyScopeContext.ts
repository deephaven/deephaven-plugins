import { createContext, useContext } from 'react';
import { EMPTY_ARRAY } from '@deephaven/utils';

/** Keys of the keyed layout elements around a panel, outermost first */
export const PanelKeyScopeContext =
  createContext<readonly string[]>(EMPTY_ARRAY);

export function usePanelKeyScope(): readonly string[] {
  return useContext(PanelKeyScopeContext);
}

/**
 * Serialize the key that identifies a panel within its panel manager.
 * @param scope Keys of the keyed layout elements around the panel
 * @param key The panel's own key
 * @returns The serialized key, or undefined if the panel isn't keyed
 */
export function getPanelKey(
  scope: readonly string[],
  key?: string
): string | undefined {
  if (key == null) {
    return undefined;
  }
  return JSON.stringify([...scope, key]);
}

export default PanelKeyScopeContext;
