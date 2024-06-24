import React, { Key, ReactElement, useMemo } from 'react';
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
import { isElementOfType } from '@deephaven/react-hooks';

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

function containsDuplicateKeys(childrenArray: TabProps[]) {
  const keys = childrenArray.map(child => child.key);
  return new Set(keys).size !== keys.length;
}

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
  const childrenArray: TabProps[] = useMemo(() => [], []);

  const hasDuplicates = useMemo(
    () => containsDuplicateKeys(childrenArray),
    [childrenArray]
  );

  if (hasDuplicates) {
    throw new Error('Duplicate keys found in Tab items.');
  }

  React.Children.forEach(children, child => {
    if (
      isElementOfType(child, TabPanels<TabProps>) ||
      isElementOfType(child, TabList<TabProps>)
    ) {
      hasTabPanelsOrLists = true;
      return;
    }
    // TODO: web-client-ui#2094 to fix the `isElementOfType` type guard which
    // which is not properly narrowing the child type. Once that is fixed, we
    // should be able to remove the `as` ReactElement<TabProps> assertion.
    const element = child as ReactElement<TabProps>;
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
  if (containsDuplicateKeys(childrenArray)) {
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
