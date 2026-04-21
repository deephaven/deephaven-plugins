import { MultiSelectProps as DHMultiSelectProps } from '@deephaven/components';
import { MultiSelectProps as DHMultiSelectJSApiProps } from '@deephaven/jsapi-components';
import {
  SerializedSelectionProps,
  useSelectionProps,
} from './useSelectionProps';
import {
  SerializedPickerEventProps,
  WrappedDHPickerJSApiProps,
} from './usePickerProps';
import { useFocusEventCallback } from './useFocusEventCallback';
import { useKeyboardEventCallback } from './useKeyboardEventCallback';

type WrappedDHMultiSelectJSApiProps =
  WrappedDHPickerJSApiProps<DHMultiSelectJSApiProps>;

export type SerializedMultiSelectProps = (
  | DHMultiSelectProps
  | WrappedDHMultiSelectJSApiProps
) &
  SerializedSelectionProps &
  SerializedPickerEventProps;

/**
 * Wrap MultiSelect props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useMultiSelectProps({
  onChange: serializedOnChange,
  onSelectionChange: serializedOnSelectionChange,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  ...otherProps
}: SerializedMultiSelectProps):
  | DHMultiSelectProps
  | WrappedDHMultiSelectJSApiProps {
  const { onChange, onSelectionChange } = useSelectionProps({
    onChange: serializedOnChange,
    onSelectionChange: serializedOnSelectionChange,
  });

  const deserializedOnFocus = useFocusEventCallback(onFocus);
  const deserializedOnBlur = useFocusEventCallback(onBlur);
  const deserializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const deserializedOnKeyUp = useKeyboardEventCallback(onKeyUp);

  return {
    onChange,
    onSelectionChange,
    onFocus: deserializedOnFocus,
    onBlur: deserializedOnBlur,
    onKeyDown: deserializedOnKeyDown,
    onKeyUp: deserializedOnKeyUp,
    // The @deephaven/components `MultiSelect` has its own normalization logic
    // that handles primitive children types (string, number, boolean). It also
    // handles nested children inside of `Item` and `Section` components, so
    // we are intentionally not wrapping `otherProps` in `mapSpectrumProps`
    ...otherProps,
  };
}
