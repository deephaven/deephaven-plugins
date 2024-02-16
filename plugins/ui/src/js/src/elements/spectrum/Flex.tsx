import React from 'react';
import { Flex as SpectrumFlex, FlexProps } from '@adobe/react-spectrum';

function Flex(props: FlexProps) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <SpectrumFlex {...props} />;
}

Flex.displayName = 'Flex';

export default Flex;
