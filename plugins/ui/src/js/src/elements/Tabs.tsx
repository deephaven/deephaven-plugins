import React, { Children, Key, isValidElement } from 'react';
import {
  Tabs as DHCTabs,
  TabsProps,
  TabPanels,
  TabList,
  Item,
} from '@deephaven/components';
// TODO: #2084 Re-export @react-types/shared types
import { CollectionChildren } from '@react-types/shared';
import { TabProps } from './Tab';

type TabComponentProps = TabsProps<TabProps> & {
  children: CollectionChildren<TabProps>;
  onChange?: (key: Key) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTabElement(item: any): item is React.ReactElement {
  return (
    item !== null &&
    typeof item === 'object' &&
    'type' in item &&
    'props' in item
  );
}

function tabChildrenConfig(
  childrenArray: React.ReactNode[],
  isTabList: boolean
) {
  const items = childrenArray
    .map((child, index) => {
      if (!isValidElement(child)) {
        return null;
      }
      const key =
        child.key ??
        (typeof child.props.title === 'string'
          ? child.props.title
          : `Key-${index}`);
      return (
        <Item key={key}>
          {isTabList ? child.props.title : child.props.children}
        </Item>
      );
    })
    .filter(isTabElement);
  return items;
}

export function Tabs(props: TabComponentProps): JSX.Element {
  const { children, onSelectionChange, ...otherTabProps } = props;
  const childrenArray = Children.toArray(children);

  if (
    childrenArray.some(
      child =>
        // isValidElement check is necessary to avoid TS error when accessing type of child
        isValidElement(child) &&
        (child.type === TabPanels || child.type === TabList)
    )
  ) {
    return (
      <DHCTabs
        UNSAFE_className="dh-tabs"
        onSelectionChange={onSelectionChange}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...otherTabProps}
      >
        {children}
      </DHCTabs>
    );
  }

  // check for duplicate keys
  const keys = childrenArray.map(child => {
    if (!isValidElement(child)) {
      throw new Error('Children must be of type TabPanel, TabList, or Tabå.');
      return null;
    }
    return child.key;
  });

  if (new Set(keys).size !== keys.length) {
    throw new Error('Duplicate keys found in Tab items.');
  }

  return (
    <DHCTabs
      UNSAFE_className="dh-tabs"
      onSelectionChange={onSelectionChange}
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
