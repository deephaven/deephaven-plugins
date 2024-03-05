import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Item,
  Tabs,
  TabList,
  Provider,
  defaultTheme,
} from '@adobe/react-spectrum';
import TabPanels from './TabPanels';
import Flex from './Flex';

describe('TabPanels', () => {
  function renderTabPanelsChild(children: React.ReactNode) {
    return render(
      <Provider theme={defaultTheme}>
        <Tabs selectedKey="foo">
          <TabList>
            <Item key="foo">Foo</Item>
          </TabList>
          <TabPanels>
            <Item key="foo">{children}</Item>
          </TabPanels>
        </Tabs>
      </Provider>
    );
  }

  it('should add height=100% prop to flex child', () => {
    const flexChild = <Flex data-testid="flex-child">Flex Child</Flex>;
    renderTabPanelsChild(flexChild);
    const flexElement = screen.queryByTestId('flex-child');
    expect(flexElement).toHaveStyle('height: 100%');
  });

  it('should not add height=100% prop to non-flex child', () => {
    const nonFlexChild = <div data-testid="non-flex-child">Non-Flex Child</div>;
    renderTabPanelsChild(nonFlexChild);
    const nonFlexElement = screen.queryByTestId('non-flex-child');
    expect(nonFlexElement).not.toHaveStyle('height: 100%');
  });
});
