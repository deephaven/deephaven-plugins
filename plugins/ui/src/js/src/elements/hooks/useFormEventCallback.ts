import React from 'react';
import useConditionalCallback from './useConditionalCallback';

export type SerializedFormEvent = {
  [key: string]: FormDataEntryValue;
};

export type SerializedFormEventCallback = (event: SerializedFormEvent) => void;

export function useFormEventCallback(
  callback?: SerializedFormEventCallback
): ((e: React.FormEvent<HTMLFormElement>) => void) | undefined {
  return useConditionalCallback(
    callback != null,
    (e: React.FormEvent<HTMLFormElement>) => {
      // We never want the page to refresh, prevent submitting the form
      e.preventDefault();

      // Return the data to the server
      const data = Object.fromEntries(new FormData(e.currentTarget));
      callback?.(data);
    },
    [callback]
  );
}
