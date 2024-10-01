import {
  TextField as DHCTextField,
  TextFieldProps as DHCTextFieldProps,
} from '@deephaven/components';
import useTextInputProps from './hooks/useTextInputProps';
import { SerializedTextInputEventProps } from './model';

export function TextField(
  props: SerializedTextInputEventProps<DHCTextFieldProps>
): JSX.Element {
  const textFieldProps = useTextInputProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCTextField {...textFieldProps} />;
}

TextField.displayName = 'TextField';

export default TextField;
