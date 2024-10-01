import {
  TextArea as DHCTextArea,
  TextAreaProps as DHCTextAreaProps,
} from '@deephaven/components';
import useTextInputProps from './hooks/useTextInputProps';
import { SerializedTextInputEventProps } from './model';

export function TextArea(
  props: SerializedTextInputEventProps<DHCTextAreaProps>
): JSX.Element {
  const textAreaProps = useTextInputProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCTextArea {...textAreaProps} />;
}

TextArea.displayName = 'TextArea';

export default TextArea;
