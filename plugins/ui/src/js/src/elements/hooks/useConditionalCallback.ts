import React, { useCallback } from 'react';

/**
 * A hook that takes a condition, a callback, and a dependencies array, then returns the callback if the condition is met, or undefined otherwise.
 * @param condition The condition to check. If it's false, the `undefined` will be return
 * @param callback The callback to use if the condition is met
 * @param deps The dependencies array to use with the callback
 * @returns The callback if the condition is met, or `undefined` otherwise
 */
export function useConditionalCallback<T extends (...args: never[]) => unknown>(
  condition: boolean,
  callback: T,
  deps: React.DependencyList
): T | undefined {
  // We don't want to include the callback in the dependencies array, as that would cause the callback to be recreated every time the passed in callback changes which defeats the purpose of using useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const optionalCallback = useCallback(callback, deps);
  return condition ? optionalCallback : undefined;
}

export default useConditionalCallback;
