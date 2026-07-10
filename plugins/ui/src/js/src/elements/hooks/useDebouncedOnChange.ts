import { useState, useCallback, useRef, useEffect } from 'react';
import Log from '@deephaven/log';
import { useDebouncedCallback, usePrevious } from '@deephaven/react-hooks';

const VALUE_CHANGE_DEBOUNCE = 250;

function useDebouncedOnChange<T, P = T>(
  propValue: P,
  propOnChange: (() => void) | ((newValue: T) => Promise<void>) | undefined,
  isFocused = false
): [T | P, (newValue: T) => void] {
  const [value, setValue] = useState<T | P>(propValue);
  const [pending, setPending] = useState(false);
  const prevPropValue = usePrevious(propValue);
  const prevIsFocused = usePrevious(isFocused);
  const log = Log.module('@deephaven/js-plugin-ui/useDebouncedValue');

  // Keep a ref to the latest `propOnChange`. The server hands us a new callable
  // reference on every re-render, so reading it through a ref lets the
  // debounced callback below stay stable (see below).
  const propOnChangeRef = useRef(propOnChange);
  useEffect(() => {
    propOnChangeRef.current = propOnChange;
  }, [propOnChange]);

  // Update local value to match a new propValue from the server when no user
  // changes are queued. Skip while the input is focused so we don't change the
  // value out from under the user while they are typing. When the input loses
  // focus, sync to the latest propValue even if it didn't change on this
  // render.
  const justBlurred = prevIsFocused === true && isFocused === false;
  const propValueChanged = propValue !== prevPropValue;
  if (
    (propValueChanged || justBlurred) &&
    propValue !== value &&
    propValue !== undefined &&
    !pending &&
    !isFocused
  ) {
    setValue(propValue);
  }

  const propDebouncedOnChange = useCallback(
    async (newValue: T) => {
      try {
        await propOnChangeRef.current?.(newValue);
      } catch (e) {
        log.warn('Error returned from onChange', e);
      }
      setPending(false);
    },
    // The callback must stay stable so the debounced callback isn't recreated
    // (and any pending call cancelled) when the server hands us a new
    // `propOnChange` on re-render. We read the latest `propOnChange` from a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const debouncedOnChange = useDebouncedCallback(
    propDebouncedOnChange,
    VALUE_CHANGE_DEBOUNCE
  );

  const onChange = useCallback(
    (newValue: T) => {
      setPending(true);
      debouncedOnChange(newValue);
      setValue(newValue);
    },
    [debouncedOnChange]
  );

  return [value, onChange] as const;
}

export default useDebouncedOnChange;
