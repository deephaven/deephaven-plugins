import { useCallback, useEffect, useRef } from 'react';
import { type WorkerVariables } from '@deephaven/jsapi-utils';

/**
 * Bridge `useWorkerVariables`' push snapshot into an awaitable for code that
 * runs outside React (e.g. a lazy fetcher inside a model transform). Returned
 * promises resolve with the next non-null snapshot, so the caller can await
 * the worker's variable list without racing the initial subscription.
 */
export function useWaitForWorkerVariables(
  workerVariables: WorkerVariables | null
): () => Promise<WorkerVariables> {
  const snapshotRef = useRef(workerVariables);
  snapshotRef.current = workerVariables;
  const resolversRef = useRef<
    [
      resolve: (value: WorkerVariables) => void,
      reject: (reason: Error) => void,
    ][]
  >([]);
  useEffect(() => {
    if (workerVariables == null) return;
    const pending = resolversRef.current;
    if (pending.length === 0) return;
    resolversRef.current = [];
    pending.forEach(({ resolve }) => resolve(workerVariables));
  }, [workerVariables]);
  // Reject any still-pending waiters on unmount so their promises settle and
  // the captured closures are released, instead of hanging (and retaining
  // those closures) indefinitely.
  useEffect(
    () => () => {
      const pending = resolversRef.current;
      resolversRef.current = [];
      pending.forEach(({ reject }) =>
        reject(new Error('Worker variables wait aborted: unmounted'))
      );
    },
    []
  );
  return useCallback(() => {
    if (snapshotRef.current != null) {
      return Promise.resolve(snapshotRef.current);
    }
    return new Promise<WorkerVariables>((resolve, reject) => {
      resolversRef.current.push({ resolve, reject });
    });
  }, []);
}

export default useWaitForWorkerVariables;
