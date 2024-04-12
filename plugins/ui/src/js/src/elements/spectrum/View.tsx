import React from 'react';
import { View as DHView, ViewProps } from '@deephaven/components';

function View(props: ViewProps): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHView {...props} />;
}

View.displayName = 'View';

export default View;
