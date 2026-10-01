import { createContext } from 'react';
import type { dh } from '@deephaven/jsapi-types';

export type SetNextCallableRefs = (
  refs: Array<dh.Table | dh.TreeTable>
) => void;

/**
 * Context that lets components inject object references into the next callable
 * invocation. References are drained after the next sendMessage call so they
 * apply to exactly one callable invocation.
 */
const WidgetCallableContext = createContext<SetNextCallableRefs | null>(null);

export default WidgetCallableContext;
