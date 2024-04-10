import {
  SerializedFocusEventCallback,
  useFocusEventCallback,
} from './spectrum/useFocusEventCallback';
import {
  SerializedKeyboardEventCallback,
  useKeyboardEventCallback,
} from './spectrum/useKeyboardEventCallback';
import {
  SerializedSelectionEventCallback,
  useSelectionEventCallback,
} from './spectrum/useSelectionEventCallback';

export interface SerializedListViewEventProps {
  /** Handler that is called when selection changes */
  onChange?: SerializedSelectionEventCallback;

  /** Handler that is called when the element receives focus. */
  onFocus?: SerializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: SerializedFocusEventCallback;

  /** Handler that is called when a key is pressed */
  onKeyDown?: SerializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: SerializedKeyboardEventCallback;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: SerializedSelectionEventCallback;
}

/**
 * Wrap ListView props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useListViewProps<T>(props: SerializedListViewEventProps & T) {
  const {
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    onChange,
    onSelectionChange,
    ...otherProps
  } = props;

  const serializedOnChange = useSelectionEventCallback(onChange);
  const serializedOnFocus = useFocusEventCallback(onFocus);
  const serializedOnBlur = useFocusEventCallback(onBlur);
  const serializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const serializedOnKeyUp = useKeyboardEventCallback(onKeyUp);
  const serializedOnSelectionChange =
    useSelectionEventCallback(onSelectionChange);

  return {
    onFocus: serializedOnFocus,
    onBlur: serializedOnBlur,
    onKeyDown: serializedOnKeyDown,
    onKeyUp: serializedOnKeyUp,
    onChange: serializedOnChange,
    onSelectionChange: serializedOnSelectionChange,
    // The @deephaven/components `ListView` has its own normalization logic that
    // handles primitive children types (string, number, boolean). It also
    // handles nested children inside of `Item` and `Section` components, so
    // we are intentionally not wrapping `otherProps` in `mapSpectrumProps`
    ...otherProps,
  };
}
