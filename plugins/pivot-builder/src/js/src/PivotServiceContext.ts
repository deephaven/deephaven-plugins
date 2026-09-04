import { createContext, useContext } from 'react';

/**
 * Availability status of the CorePlus pivot feature on the worker backing the
 * current panel. Pivot is CorePlus-only, so the middleware derives this from
 * the API flavor and exposes it to the sidebar `CreatePivotPage` via this
 * context.
 */
export type PivotServiceStatus = 'loading' | 'ready' | 'unavailable';

export type PivotServiceContextValue = {
  status: PivotServiceStatus;
};

export const PivotServiceContext = createContext<PivotServiceContextValue>({
  status: 'loading',
});

export function usePivotServiceStatus(): PivotServiceStatus {
  return useContext(PivotServiceContext).status;
}
