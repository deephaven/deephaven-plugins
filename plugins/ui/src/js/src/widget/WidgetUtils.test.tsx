import React from 'react';
import { Text } from '@deephaven/components';
import {
  ELEMENT_NAME,
  ELEMENT_PREFIX,
} from '../elements/model/ElementConstants';
import { ElementNode, ELEMENT_KEY } from '../elements/utils/ElementUtils';
import HTMLElementView from '../elements/HTMLElementView';
import IconElementView from '../elements/IconElementView';
import {
  elementComponentMap,
  getComponentForElement,
  getComponentTypeForElement,
  getPreservedData,
} from './WidgetUtils';

describe('getComponentTypeForElement', () => {
  it.each(
    Object.keys(elementComponentMap) as (keyof typeof elementComponentMap)[]
  )(
    'should return the correct component type for a given key: %s',
    elementKey => {
      const actual = getComponentTypeForElement({ [ELEMENT_KEY]: elementKey });
      expect(actual).toBe(elementComponentMap[elementKey]);
    }
  );
});

describe('getComponentForElement', () => {
  it.each([
    /* eslint-disable react/jsx-key */
    [`${ELEMENT_PREFIX.html}div`, HTMLElementView],
    [`${ELEMENT_PREFIX.icon}vsAdd`, IconElementView],
    /* eslint-enable react/jsx-key */
  ] as [string, ({ element }: { element: unknown }) => JSX.Element][])(
    'should use expected element factory function: %s',
    (elementKey, factory) => {
      const actual = getComponentForElement({ [ELEMENT_KEY]: elementKey });
      expect(actual).toEqual(
        factory({ element: { [ELEMENT_KEY]: elementKey } })
      );
    }
  );

  it.each(
    Object.keys(elementComponentMap) as (keyof typeof elementComponentMap)[]
  )('should spread props for element nodes: %s', elementKey => {
    let element: ElementNode = { [ELEMENT_KEY]: elementKey };

    if (elementKey === ELEMENT_NAME.fragment) {
      element = {
        ...element,
        props: { key: 'mock.key', children: ['Some child'] },
      };
    } else if (elementKey === ELEMENT_NAME.item) {
      element = {
        ...element,
        props: { children: <Text>Some child</Text> },
      };
    }

    const actual = getComponentForElement(element);

    const Expected = elementComponentMap[elementKey] as (
      props: Record<string, unknown>
    ) => JSX.Element;

    expect(actual).toEqual(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Expected {...(element.props as Parameters<typeof Expected>[0])} />
    );
  });
});

describe('getPreservedData', () => {
  it('should handle undefined widget data', () => {
    const actual = getPreservedData(undefined);
    expect(actual).toEqual({});
  });
  it('should handle empty widget data', () => {
    const actual = getPreservedData({});
    expect(actual).toEqual({});
  });
  it('should return only the panelIds from the widget data', () => {
    const widgetData = {
      panelIds: ['1', '2', '3'],
      state: { foo: 'bar' },
    };

    const actual = getPreservedData(widgetData);
    expect(actual).toEqual({ panelIds: widgetData.panelIds });
  });
});
