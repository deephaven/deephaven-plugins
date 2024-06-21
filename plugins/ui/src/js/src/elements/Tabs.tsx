import React, { Key, ReactElement } from 'react';
import {
  Tabs as DHCTabs,
  TabsProps,
  TabPanels,
  TabList,
  Item,
  TabPanelsProps,
  Text,
} from '@deephaven/components';
import { CollectionChildren } from '@react-types/shared';

type TabProps = {
  children: ReactElement;
  title: string;
  key: string | null;
  icon?: ReactElement;
};

type TabPanelsListProps = TabPanelsProps<TabProps>;

type TabComponentProps = TabsProps<TabProps> & {
  children:
    | CollectionChildren<TabProps>
    | CollectionChildren<TabPanelsListProps>;
  onChange?: (key: Key) => void;
};

function tabChildrenConfig(childrenArray: TabProps[], isTabList: boolean) {
  const items = childrenArray.map(child => {
    const key = child.key ?? child.title;
    return (
      <Item key={key}>
        {isTabList && child.icon && (
          <>
            {child.icon}
            <Text>{child.title}</Text>
          </>
        )}
        {isTabList && !child.icon && child.title}
        {!isTabList && child.children}
      </Item>
    );
  });
  return items;
}

export function Tabs(props: TabComponentProps): JSX.Element {
  const { children, onChange, ...otherTabProps } = props;
  let hasTabPanelsOrLists = false;

  const childrenArray: TabProps[] = [];
  React.Children.forEach(children, child => {
    const element = child as ReactElement<TabProps>;
    if (element.type === TabPanels || element.type === TabList) {
      hasTabPanelsOrLists = true;
      return;
    }
    const tabProps: TabProps = {
      ...element.props,
      key: element.key != null ? element.key : null,
    };
    childrenArray.push(tabProps);
  });

  if (hasTabPanelsOrLists) {
    return (
      <DHCTabs
        UNSAFE_className="dh-tabs"
        onSelectionChange={onChange}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...otherTabProps}
      >
        {children}
      </DHCTabs>
    );
  }

  // check for duplicate keys
  const keys = childrenArray.map(child => child.key);
  if (new Set(keys).size !== keys.length) {
    throw new Error('Duplicate keys found in Tab items.');
  }
  return (
    <DHCTabs
      UNSAFE_className="dh-tabs"
      onSelectionChange={onChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherTabProps}
    >
      <TabList>{tabChildrenConfig(childrenArray, true)}</TabList>
      <TabPanels UNSAFE_className="dh-tabs">
        {tabChildrenConfig(childrenArray, false)}
      </TabPanels>
    </DHCTabs>
  );
}
Tabs.displayName = 'Tabs';
export default Tabs;
