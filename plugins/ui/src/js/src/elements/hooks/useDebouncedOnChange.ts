import { useState, useCallback } from 'react';
import Log from '@deephaven/log';
import { useDebouncedCallback, usePrevious } from '@deephaven/react-hooks';

const VALUE_CHANGE_DEBOUNCE = 250;

function useDebouncedOnChange<T>(
  propValue: T,
  propOnChange: (() => void) | ((newValue: T) => Promise<void>)
): [T, (newValue: T) => void] {
  const [value, setValue] = useState<T>(propValue);
  const [pending, setPending] = useState(false);
  const prevPropValue = usePrevious(propValue);
  const log = Log.module('@deephaven/js-plugin-ui/useDebouncedValue');

  // Update local value to new propValue if the server sent a new propValue and no user changes have been queued
  if (
    propValue !== prevPropValue &&
    propValue !== value &&
    propValue !== undefined &&
    !pending
  ) {
    setValue(propValue);
  }

  const propDebouncedOnChange = useCallback(
    async (newValue: T) => {
      try {
        await propOnChange(newValue);
      } catch (e) {
        log.warn('Error returned from onChange', e);
      }
      setPending(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [propOnChange]
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
