import React from 'react';
import { Flex as DHFlex, FlexProps } from '@deephaven/components';

function Flex(props: FlexProps): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHFlex {...props} />;
}

Flex.displayName = 'Flex';

export default Flex;
