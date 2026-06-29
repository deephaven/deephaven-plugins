import {
  NumberField as DHCNumberField,
  type NumberFieldProps as DHCNumberFieldProps,
} from '@deephaven/components';
import useTextInputProps from './hooks/useTextInputProps';
import { type SerializedTextInputEventProps } from './model';

export function NumberField(
  props: SerializedTextInputEventProps<DHCNumberFieldProps, number>
): JSX.Element {
  const numberFieldProps = useTextInputProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCNumberField {...numberFieldProps} />;
}

NumberField.displayName = 'NumberField';

export default NumberField;
