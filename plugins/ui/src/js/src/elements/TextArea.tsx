import {
  TextArea as DHCTextArea,
  type TextAreaProps as DHCTextAreaProps,
} from '@deephaven/components';
import useTextInputProps from './hooks/useTextInputProps';
import { type SerializedTextInputEventProps } from './model';

export function TextArea(
  props: SerializedTextInputEventProps<DHCTextAreaProps, string>
): JSX.Element {
  const textAreaProps = useTextInputProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCTextArea {...textAreaProps} />;
}

TextArea.displayName = 'TextArea';

export default TextArea;
