import React, { Key, ReactElement, useMemo } from 'react';
import {
  Tabs as DHCTabs,
  TabsProps,
  TabList,
  Item,
  TabPanelsProps,
  Text,
  TabListProps,
} from '@deephaven/components';
import { isElementOfType } from '@deephaven/react-hooks';
import { ensureArray } from '@deephaven/utils';
import classNames from 'classnames';
import { TabPanels } from './TabPanels';

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
  onSelectionChange?: (key: Key) => void;
};

type TabChild =
  | ReactElement<TabProps>
  | ReactElement<TabListProps<TabProps>, typeof TabList<TabProps>>
  | ReactElement<TabPanelsProps<TabProps>, typeof TabPanels>;

function containsDuplicateKeys(childrenArray: JSX.Element[]) {
  const keys = childrenArray.map(child => child.key);
  return new Set(keys).size !== keys.length;
}

/**
 * `transformTabsToItems` processes an array of React elements representing tab children,
 *  mapping them to a collection of `Item` components for the React Spectrum `TabList` and `TabPanels` components.
 *
 * @param childrenArray An array of React elements, each representing a tab child with props.
 * @param data A boolean indicating if the current processing is for a TabList, changing how content is structured within each resulting `Item`.
 */
function transformTabsToItems(
  childrenArray: ReactElement<TabProps>[],
  isTabList: boolean
) {
  const items = childrenArray.map(({ key: propKey, props }) => {
    const key = propKey ?? props.title;
    const textValue = props.textValue ?? props.title;
    let content = props.children;

    if (isTabList) {
      if (props.icon) {
        content = (
          <>
            {props.icon}
            <Text>{props.title}</Text>
          </>
        );
      } else {
        content = <Text>{props.title}</Text>;
      }
    }
    return (
      <Item key={key} textValue={textValue}>
        {content}
      </Item>
    );
  });
  if (containsDuplicateKeys(items)) {
    throw new Error('Duplicate keys found in Tab items.');
  }
  return items;
}

export function Tabs(props: TabComponentProps): JSX.Element {
  const {
    children,
    onSelectionChange: onSelectionChangeProp,
    onChange,
    UNSAFE_className,
    ...otherTabProps
  } = props;
  const childrenArray = useMemo(() => ensureArray(children), [children]);

  const onSelectionChange = onSelectionChangeProp ?? onChange;

  const tabPanelsOrLists = childrenArray.filter(
    child =>
      isElementOfType(child, TabList) || isElementOfType(child, TabPanels)
  );
  const hasTabPanelsOrLists = tabPanelsOrLists.length > 0;

  const tabItems = childrenArray.filter(child => isElementOfType(child, Item));
  const hasTabItems = tabItems.length > 0;

  const hasUnsupportedChild =
    tabPanelsOrLists.length + tabItems.length !== childrenArray.length;

  if (hasTabPanelsOrLists && hasTabItems) {
    throw new Error(
      'Cannot declare tabs with ui.tab and ui.tab_list/ui.tab_panels at the same time.'
    );
  }

  if (hasUnsupportedChild) {
    throw new Error(
      'Unknown child in tabs component. Only use ui.tab or ui.tab_list/ui.tab_panels.'
    );
  }

  const tabListChildren = useMemo(
    () =>
      hasTabPanelsOrLists
        ? []
        : transformTabsToItems(
            childrenArray as unknown as ReactElement<TabProps>[],
            true
          ),
    [hasTabPanelsOrLists, childrenArray]
  );

  const tabPanelsChildren = useMemo(
    () =>
      hasTabPanelsOrLists
        ? []
        : transformTabsToItems(
            childrenArray as unknown as ReactElement<TabProps>[],
            false
          ),
    [hasTabPanelsOrLists, childrenArray]
  );

  if (hasTabPanelsOrLists) {
    return (
      <DHCTabs
        onSelectionChange={onSelectionChange}
        UNSAFE_className={classNames('dh-tabs', UNSAFE_className)}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...otherTabProps}
      >
        {children}
      </DHCTabs>
    );
  }

  return (
    <DHCTabs
      onSelectionChange={onSelectionChange}
      UNSAFE_className={classNames('dh-tabs', UNSAFE_className)}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherTabProps}
    >
      <TabList marginBottom="size-100">{tabListChildren}</TabList>
      <TabPanels>{tabPanelsChildren}</TabPanels>
    </DHCTabs>
  );
}

Tabs.displayName = 'Tabs';
export default Tabs;
