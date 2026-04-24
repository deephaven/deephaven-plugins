/**
 * Augment @deephaven/plugin with usePersistentState.
 * This hook is exported at runtime (mainbranch) but not yet in the published
 * npm type declarations. Remove this augmentation once the published types
 * include usePersistentState.
 */

// Top-level export makes this a module, so `declare module` augments
// the existing @deephaven/plugin types instead of replacing them.
export {};

declare module '@deephaven/plugin' {
  import type { Dispatch, SetStateAction } from 'react';

  export function usePersistentState<S>(
    initialState: S | (() => S),
    config: {
      type: string;
      version: number;
      migrations?: Array<{
        from: number;
        migrate: (state: unknown) => unknown;
      }>;
      deleteOnUnmount?: boolean;
    }
  ): [state: S, setState: Dispatch<SetStateAction<S>>];
}
