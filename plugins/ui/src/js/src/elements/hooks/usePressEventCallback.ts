import { useCallback } from 'react';
import { PressEvent } from '@deephaven/components';
import { getTargetName } from '../utils';

export function serializePressEvent(event: PressEvent): SerializedPressEvent {
  const { target, type, pointerType, shiftKey, ctrlKey, metaKey, altKey } =
    event;
  return {
    target: getTargetName(target),
    type,
    pointerType,
    shiftKey,
    ctrlKey,
    metaKey,
    altKey,
  };
}

/**
 * PressEvent serialized so it can be sent to the server.
 * Replaces the target with the `name` of the target element (if available)
 */
export type SerializedPressEvent = Pick<
  PressEvent,
  'type' | 'pointerType' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'
> & { target?: string };

export type SerializedPressEventCallback = (
  event: SerializedPressEvent
) => void;

/**
 * Get a callback function to be passed into spectrum components
 * @param callback PressEvent callback to be called with the serialized event
 * @returns A callback to be passed into the Spectrum component that transforms the event and calls the provided callback
 */
export function usePressEventCallback(
  callback?: SerializedPressEventCallback
): (e: PressEvent) => void {
  return useCallback(
    (e: PressEvent) => {
      callback?.(serializePressEvent(e));
    },
    [callback]
  );
}
