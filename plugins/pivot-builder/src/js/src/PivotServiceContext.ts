import { createContext, useContext } from 'react';

/**
 * Availability status of the CorePlus `PivotService` widget on the worker
 * backing the current panel. The middleware kicks off a one-shot fetch on
 * mount and propagates the result to the sidebar `CreatePivotPage` via this
 * context.
 */
export type PivotServiceStatus = 'loading' | 'ready' | 'unavailable';

export type PivotServiceContextValue = {
  status: PivotServiceStatus;
  /**
   * Ask the middleware to re-probe PSP availability. The probe is a no-op
   * unless status is currently `'unavailable'`, so consumers may call this
   * unconditionally (e.g. on mount) without causing the ready path to flicker
   * through `'loading'`.
   */
  refresh: () => void;
};

const noop = (): void => undefined;

export const PivotServiceContext = createContext<PivotServiceContextValue>({
  status: 'loading',
  refresh: noop,
});

export function usePivotServiceStatus(): PivotServiceStatus {
  return useContext(PivotServiceContext).status;
}

export function usePivotServiceRefresh(): () => void {
  return useContext(PivotServiceContext).refresh;
}
