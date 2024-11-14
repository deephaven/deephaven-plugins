import {
  SearchField as DHCSearchField,
  SearchFieldProps as DHCSearchFieldProps,
} from '@deephaven/components';
import {
  useConditionalCallback,
  useFocusEventCallback,
  useKeyboardEventCallback,
} from './hooks';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';

export function SearchField(
  props: DHCSearchFieldProps & {
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

  const [value, onChange] = useDebouncedOnChange(
    propValue ?? defaultValue,
    propOnChange
  );

  const onFocus = useFocusEventCallback(propOnFocus);
  const onBlur = useFocusEventCallback(propOnBlur);

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
