import React, { useCallback } from 'react';

export type SerializedFormEvent = {
  [key: string]: FormDataEntryValue;
};

export type SerializedFormEventCallback = (event: SerializedFormEvent) => void;

export function useFormEventCallback(
  callback?: SerializedFormEventCallback
): ((e: React.FormEvent<HTMLFormElement>) => void) | undefined {
  const formCallback = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      // We never want the page to refresh, prevent submitting the form
      e.preventDefault();

      // Return the data to the server
      const data = Object.fromEntries(new FormData(e.currentTarget));
      callback?.(data);
    },
    [callback]
  );

  return callback ? formCallback : undefined;
}
