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
  const resolversRef = useRef<Array<(value: WorkerVariables) => void>>([]);
  useEffect(() => {
    if (workerVariables == null) return;
    const pending = resolversRef.current;
    if (pending.length === 0) return;
    resolversRef.current = [];
    pending.forEach(resolve => resolve(workerVariables));
  }, [workerVariables]);
  return useCallback(() => {
    if (snapshotRef.current != null) {
      return Promise.resolve(snapshotRef.current);
    }
    return new Promise<WorkerVariables>(resolve => {
      resolversRef.current.push(resolve);
    });
  }, []);
}

export default useWaitForWorkerVariables;
