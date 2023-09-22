import React, { useCallback } from 'react';
import {
  ActionButton as SpectrumActionButton,
  SpectrumActionButtonProps,
} from '@adobe/react-spectrum';

function ActionButton(
  props: SpectrumActionButtonProps & { onPress?: () => void }
) {
  const { onPress: propOnPress, ...otherProps } = props;

  const onPress = useCallback(
    e => {
      propOnPress?.();
    },
    [propOnPress]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumActionButton onPress={onPress} {...otherProps} />
  );
}

ActionButton.displayName = 'ActionButton';

export default ActionButton;
