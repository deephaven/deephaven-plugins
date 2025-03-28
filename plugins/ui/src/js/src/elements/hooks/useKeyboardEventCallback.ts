import { KeyboardEvent } from 'react';
import useConditionalCallback from './useConditionalCallback';

export function serializeKeyboardEvent(
  event: KeyboardEvent
): SerializedKeyboardEvent {
  const { code, key, shiftKey, ctrlKey, metaKey, altKey, repeat, type } = event;
  return { code, key, shiftKey, ctrlKey, metaKey, altKey, repeat, type };
}

/**
 * KeyboardEvent serialized so it can be sent to the server.
 */
export type SerializedKeyboardEvent = Pick<
  KeyboardEvent,
  | 'code'
  | 'key'
  | 'shiftKey'
  | 'ctrlKey'
  | 'metaKey'
  | 'altKey'
  | 'repeat'
  | 'type'
>;

export type SerializedKeyboardEventCallback = (
  event: SerializedKeyboardEvent
) => void;

export type DeserializedKeyboardEventCallback = (e: KeyboardEvent) => void;

/**
 * Get a callback function to be passed into spectrum components
 * @param callback KeyboardEvent callback to be called with the serialized event
 * @returns A callback to be passed into the Spectrum component that transforms the event and calls the provided callback
 */
export function useKeyboardEventCallback(
  callback?: SerializedKeyboardEventCallback
): DeserializedKeyboardEventCallback | undefined {
  return useConditionalCallback(
    callback != null,
    (e: KeyboardEvent) => {
      callback?.(serializeKeyboardEvent(e));
    },
    [callback]
  );
}
