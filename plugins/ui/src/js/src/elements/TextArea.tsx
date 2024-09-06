import React from 'react';
import { TextArea as DHCTextArea, TextAreaProps } from '@deephaven/components';
import useTextAreaProps from './hooks/useTextAreaProps';
import { SerializedTextAreaEventProps } from './model';

export function TextArea(
  props: SerializedTextAreaEventProps<TextAreaProps>
): JSX.Element {
  const textAreaProps = useTextAreaProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCTextArea {...textAreaProps} />;
}

TextArea.displayName = 'TextArea';

export default TextArea;
