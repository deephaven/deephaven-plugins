import React from 'react';
import { Text } from '@adobe/react-spectrum';
import { Item } from '@deephaven/components';
import type { WidgetExportedObject } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import { ELEMENT_KEY, isPrimitive, wrapElementChildren } from './ElementUtils';
import ObjectView from './ObjectView';
import { ITEM_ELEMENT_NAME } from './ElementConstants';

const { createMockProxy } = TestUtils;

describe('isPrimitive', () => {
  it.each(['test', 444, true, false])(
    'should return true primitive values: %s',
    value => {
      const actual = isPrimitive(value);
      expect(actual).toBe(true);
    }
  );

  it('should return false for non-primitive values', () => {
    const actual = isPrimitive({});
    expect(actual).toBe(false);
  });
});

describe('wrapElementChildren', () => {
  const mock = {
    exportedA1: createMockProxy<WidgetExportedObject>({
      type: 'mock.exported.a',
    }),
    exportedA2: createMockProxy<WidgetExportedObject>({
      type: 'mock.exported.a',
    }),
    exportedB1: createMockProxy<WidgetExportedObject>({
      type: 'mock.exported.b',
    }),
    itemWithString: <Item>String</Item>,
    itemWithNumber: <Item>{123}</Item>,
    itemWithTrue: <Item>{true}</Item>,
    itemWithFalse: <Item>{false}</Item>,
  };

  it('should return given element if it has no children', () => {
    const actual = wrapElementChildren({ [ELEMENT_KEY]: 'mock.element' });
    expect(actual).toBe(actual);
  });

  it.each([
    [
      mock.exportedA1,
      <ObjectView key={`${mock.exportedA1.type}-0`} object={mock.exportedA1} />,
    ],
    [
      [mock.exportedA1, mock.exportedA2, mock.exportedB1],
      [
        <ObjectView
          key={`${mock.exportedA1.type}-0`}
          object={mock.exportedA1}
        />,
        <ObjectView
          key={`${mock.exportedA1.type}-1`}
          object={mock.exportedA1}
        />,
        <ObjectView
          key={`${mock.exportedB1.type}-0`}
          object={mock.exportedB1}
        />,
      ],
    ],
  ])(
    'should wrap exported object children in ObjectView: %s, %s',
    (children, expectedChildren) => {
      const actual = wrapElementChildren({
        [ELEMENT_KEY]: 'mock.element',
        props: { children },
      });

      expect(actual.props?.children).toEqual(expectedChildren);
    }
  );

  describe.each(['Some text value', undefined])(
    'Item element `textValue`: `%s`',
    textValue => {
      it.each([
        /* eslint-disable react/jsx-key */
        ['String', <Text key="String">String</Text>],
        [999, <Text key="999">999</Text>],
        [true, <Text key="true">true</Text>],
        [false, <Text key="false">false</Text>],
        [
          ['String', 999, true, false],
          [
            <Text key="String">String</Text>,
            <Text key="999">999</Text>,
            <Text key="true">true</Text>,
            <Text key="false">false</Text>,
          ],
        ],
        /* eslint-enable react/jsx-key */
      ])(
        'should wrap primitive item element children in Text elements: %s, %s',
        (children, expectedChildren) => {
          const given =
            textValue == null
              ? {
                  [ELEMENT_KEY]: ITEM_ELEMENT_NAME,
                  props: { children },
                }
              : {
                  [ELEMENT_KEY]: ITEM_ELEMENT_NAME,
                  props: { textValue, children },
                };

          const actual = wrapElementChildren(given);

          const fallbackTextValue = Array.isArray(children)
            ? undefined
            : String(children);

          const expected = {
            [ELEMENT_KEY]: ITEM_ELEMENT_NAME,
            props: {
              textValue: textValue ?? fallbackTextValue,
              children: expectedChildren,
            },
          };

          expect(actual).toEqual(expected);
        }
      );
    }
  );
});
