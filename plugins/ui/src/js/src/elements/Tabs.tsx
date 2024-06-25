import React, { Key, ReactElement, useMemo } from 'react';
import {
  Tabs as DHCTabs,
  TabsProps,
  TabPanels,
  TabList,
  Item,
  TabPanelsProps,
  Text,
  TabListProps,
} from '@deephaven/components';
import { isElementOfType } from '@deephaven/react-hooks';
import { ensureArray } from '@deephaven/utils';

type TabProps = {
  children: ReactElement;
  title: string;
  key: string | null;
  icon?: ReactElement;
  textValue?: string;
};

type TabComponentProps = TabsProps<TabProps> & {
  children: TabChild | TabChild[];
  onChange?: (key: Key) => void;
};

type TabChild =
  | ReactElement<TabProps>
  | ReactElement<TabListProps<TabProps>, typeof TabList<TabProps>>
  | ReactElement<TabPanelsProps<TabProps>, typeof TabPanels<TabProps>>;

function containsDuplicateKeys(childrenArray: JSX.Element[]) {
  const keys = childrenArray.map(child => child.key);
  return new Set(keys).size !== keys.length;
}

function tabChildrenConfig(
  childrenArray: ReactElement<TabProps>[],
  isTabList: boolean
) {
  const items = childrenArray.map(({ key: propKey, props }) => {
    const key = propKey ?? props.title;
    const textValue = props.textValue ?? props.title;
    return (
      <Item key={key} textValue={textValue}>
        {isTabList && props.icon && (
          <>
            {props.icon}
            <Text>{props.title}</Text>
          </>
        )}
        {isTabList && !props.icon && props.title}
        {!isTabList && props.children}
      </Item>
    );
  });
  if (containsDuplicateKeys(items)) {
    throw new Error('Duplicate keys found in Tab items.');
  }
  return items;
}

export function Tabs(props: TabComponentProps): JSX.Element {
  const { children, onChange, ...otherTabProps } = props;
  const childrenArray = useMemo(() => ensureArray(children), [children]);

  const hasTabPanelsOrList = childrenArray.some(
    child =>
      isElementOfType(child, TabPanels<TabProps>) ||
      isElementOfType(child, TabList<TabProps>)
  );

  const tabListChildren = useMemo(
    () =>
      hasTabPanelsOrList
        ? []
        : tabChildrenConfig(
            childrenArray as unknown as ReactElement<TabProps>[],
            true
          ),
    [hasTabPanelsOrList, childrenArray]
  );

  const tabPanelsChildren = useMemo(
    () =>
      hasTabPanelsOrList
        ? []
        : tabChildrenConfig(
            childrenArray as unknown as ReactElement<TabProps>[],
            false
          ),
    [hasTabPanelsOrList, childrenArray]
  );

  if (hasTabPanelsOrList) {
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

  return (
    <DHCTabs
      UNSAFE_className="dh-tabs"
      onSelectionChange={onChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherTabProps}
    >
      <TabList>{tabListChildren}</TabList>
      <TabPanels UNSAFE_className="dh-tabs">{tabPanelsChildren}</TabPanels>
    </DHCTabs>
  );
}
Tabs.displayName = 'Tabs';
export default Tabs;
