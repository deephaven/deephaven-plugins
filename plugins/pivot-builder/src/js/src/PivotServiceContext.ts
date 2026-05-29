import { createContext, useContext } from 'react';

/**
 * Availability status of the CorePlus `PivotService` widget on the worker
 * backing the current panel. The middleware kicks off a one-shot fetch on
 * mount and propagates the result to the sidebar `CreatePivotPage` via this
 * context.
 */
export type PivotServiceStatus = 'loading' | 'ready' | 'unavailable';

export const PivotServiceContext = createContext<PivotServiceStatus>('loading');

export function usePivotServiceStatus(): PivotServiceStatus {
  return useContext(PivotServiceContext);
}
