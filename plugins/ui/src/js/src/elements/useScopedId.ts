import React, { useContext, useMemo } from 'react';

export const SCOPE_ID_DELIMITER = '/';

export const ScopedIdContext = React.createContext<string>('');

/**
 * Use an ID that includes all of the parent IDs
 * @param id ID of this scope, or a function to generate the ID
 * @param newScope If true, this scope will be a new scope and not include the parent scope
 * @param scopeDelimiter Character to use to delimit the scopes when joining them together
 * @returns An ID that is all the parent scopes joined with the scopeDelimiter and the ID of this scope
 */
export function useScopedId(
  id: string | (() => string),
  newScope = false,
  scopeDelimiter = SCOPE_ID_DELIMITER
): string {
  const parentId = useContext(ScopedIdContext);
  const scopedId = useMemo(() => {
    const resolvedId = typeof id === 'function' ? id() : id;
    return !newScope && parentId.length > 0
      ? `${parentId}${scopeDelimiter}${resolvedId}`
      : resolvedId;
  }, [id, parentId, newScope, scopeDelimiter]);

  return scopedId;
}
