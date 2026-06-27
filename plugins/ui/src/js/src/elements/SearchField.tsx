import { type FocusEvent, useCallback, useState } from 'react';
import {
  SearchField as DHCSearchField,
  type SearchFieldProps as DHCSearchFieldProps,
} from '@deephaven/components';
import {
  useConditionalCallback,
  useFocusEventCallback,
  useKeyboardEventCallback,
} from './hooks';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';
import { type SerializedTextInputEventProps } from './model';

export function SearchField(
  props: SerializedTextInputEventProps<DHCSearchFieldProps, string> & {
    onSubmit?: (value: string) => void;
    onClear?: () => void;
  }
): JSX.Element {
  const {
    defaultValue = '',
    value: propValue,
    onSubmit: propOnSubmit,
    onClear: propOnClear,
    onFocus: propOnFocus,
    onBlur: propOnBlur,
    onFocusChange: propOnFocusChange,
    onKeyDown: propOnKeyDown,
    onKeyUp: propOnKeyUp,
    onChange: propOnChange,
    ...otherProps
  } = props;

  const onSubmit = useConditionalCallback(
    propOnSubmit != null,
    (value: string) => {
      propOnSubmit?.(value);
    },
    [propOnSubmit]
  );

  const onClear = useConditionalCallback(
    propOnClear != null,
    () => {
      propOnClear?.();
    },
    [propOnClear]
  );

  const onFocusChange = useConditionalCallback(
    propOnFocusChange != null,
    (isFocused: boolean) => {
      propOnFocusChange?.(isFocused);
    },
    [propOnFocusChange]
  );

  // Track focus locally so we can avoid replacing the value out from under the
  // user while they are typing (see useDebouncedOnChange).
  const [isFocused, setIsFocused] = useState(false);
  const serializedOnFocus = useFocusEventCallback(propOnFocus);
  const serializedOnBlur = useFocusEventCallback(propOnBlur);
  const onFocus = useCallback(
    (e: FocusEvent) => {
      setIsFocused(true);
      serializedOnFocus?.(e);
    },
    [serializedOnFocus]
  );
  const onBlur = useCallback(
    (e: FocusEvent) => {
      setIsFocused(false);
      serializedOnBlur?.(e);
    },
    [serializedOnBlur]
  );

  const [value, onChange] = useDebouncedOnChange(
    propValue ?? defaultValue,
    propOnChange,
    isFocused
  );

  const onKeyDown = useKeyboardEventCallback(propOnKeyDown);
  const onKeyUp = useKeyboardEventCallback(propOnKeyUp);

  return (
    <DHCSearchField
      defaultValue={defaultValue}
      value={value}
      onSubmit={onSubmit}
      onClear={onClear}
      onFocus={onFocus}
      onBlur={onBlur}
      onFocusChange={onFocusChange}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onChange={onChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    />
  );
}

SearchField.displayName = 'SearchField';

export default SearchField;
