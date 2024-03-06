import React from 'react';
import {
  FRAGMENT_ELEMENT_NAME,
  HTML_ELEMENT_NAME_PREFIX,
  ICON_ELEMENT_TYPE_PREFIX,
} from '../elements/ElementConstants';
import { ELEMENT_KEY } from '../elements/ElementUtils';
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
  )('should spread props for element nodes', elementKey => {
    const element = {
      [ELEMENT_KEY]: elementKey,
      props:
        elementKey === FRAGMENT_ELEMENT_NAME
          ? { key: 'mock.key', children: ['Some child'] }
          : {
              'data-test': 'mock.value',
              children: ['Some child'],
            },
    };
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
