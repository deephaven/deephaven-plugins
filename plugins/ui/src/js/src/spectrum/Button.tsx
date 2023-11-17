import React, { useCallback } from 'react';
import {
  Button as SpectrumButton,
  SpectrumButtonProps,
} from '@adobe/react-spectrum';

function Button(props: SpectrumButtonProps & { onPress?: () => void }) {
  const { onPress: propOnPress, ...otherProps } = props;

  const onPress = useCallback(
    e => {
      // The PressEvent from React Spectrum is not serializable (contains circular references). We're just dropping the event here but we should probably convert it.
      // TODO(#76): Need to serialize PressEvent and send with the callback instead of just dropping it.
      propOnPress?.();
    },
    [propOnPress]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumButton onPress={onPress} {...otherProps} />
  );
}

Button.displayName = 'Button';

export default Button;
