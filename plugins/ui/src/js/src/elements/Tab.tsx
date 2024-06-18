import React, { ReactNode } from 'react';
import { Item } from '@deephaven/components';

export interface TabProps {
  children: ReactNode;
  title: ReactNode;
  key: string | number;
}

export function Tab(props: TabProps): React.JSX.Element {
  const { title, children, key } = props;
  return (
    <Item key={key} title={title}>
      {children}
    </Item>
  );
}

export default Tab;
