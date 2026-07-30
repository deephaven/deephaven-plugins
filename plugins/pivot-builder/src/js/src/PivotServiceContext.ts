import { createContext, useContext } from 'react';

/**
 * Availability status of the CorePlus `PivotService` widget on the worker
 * backing the current panel. The middleware subscribes to the worker's live
 * variable list (`useWorkerVariables`) and exposes the derived status to the
 * sidebar `CreatePivotPage` via this context.
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
