import { useEffect, useMemo } from 'react';
import type { DebouncedFunc } from 'lodash';
import throttle from 'lodash.throttle';

/**
 * Wraps a given callback in a cancelable, throttled function. The throttled
 * callback is automatically cancelled if the callback reference changes or the
 * component unmounts.
 * @param callback callback function to throttle
 * @param throttleMs throttle milliseconds
 * @returns a cancelable, debounced function
 */
export function useThrottledCallback<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
  throttleMs: number
): DebouncedFunc<(...args: TArgs) => TResult> {
  const debouncedCallback = useMemo(
    () => throttle(callback, throttleMs),
    [callback, throttleMs]
  );

  useEffect(() => () => debouncedCallback.cancel(), [debouncedCallback]);

  return debouncedCallback;
}

export default useThrottledCallback;
