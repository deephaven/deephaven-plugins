import React from 'react';
import { Text } from '@adobe/react-spectrum';
import {
  FRAGMENT_ELEMENT_NAME,
  ITEM_ELEMENT_NAME,
  HTML_ELEMENT_NAME_PREFIX,
  ICON_ELEMENT_TYPE_PREFIX,
} from '../elements/ElementConstants';
import { ElementNode, ELEMENT_KEY } from '../elements/ElementUtils';
import HTMLElementView from '../elements/HTMLElementView';
import IconElementView from '../elements/IconElementView';
import { SPECTRUM_ELEMENT_TYPE_PREFIX } from '../elements/SpectrumElementUtils';
import SpectrumElementView from '../elements/SpectrumElementView';
import {
  elementComponentMap,
  getComponentForElement,
  getComponentTypeForElement,
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
    [`${HTML_ELEMENT_NAME_PREFIX}div`, HTMLElementView],
    [`${SPECTRUM_ELEMENT_TYPE_PREFIX}ActionButton`, SpectrumElementView],
    [`${ICON_ELEMENT_TYPE_PREFIX}vsAdd`, IconElementView],
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

    if (elementKey === FRAGMENT_ELEMENT_NAME) {
      element = {
        ...element,
        props: { key: 'mock.key', children: ['Some child'] },
      };
    } else if (elementKey === ITEM_ELEMENT_NAME) {
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
