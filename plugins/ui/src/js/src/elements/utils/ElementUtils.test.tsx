import React from 'react';
import { Text } from '@deephaven/components';
import type { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import {
  ELEMENT_KEY,
  fetchReexportedTable,
  isPrimitive,
  wrapElementChildren,
} from './ElementUtils';
import ObjectView from '../ObjectView';
import { ELEMENT_NAME } from '../model/ElementConstants';

const { asMock, createMockProxy } = TestUtils;

describe('fetchReexportedTable', () => {
  it('should return null for null object', async () => {
    const actual = await fetchReexportedTable(null);
    expect(actual).toBeNull();
  });

  it('should return table for non-null object', async () => {
    const table = createMockProxy<dh.Table>();

    const reexported = createMockProxy<dh.WidgetExportedObject>();
    asMock(reexported.fetch).mockResolvedValue(table);

    const exported = createMockProxy<dh.WidgetExportedObject>();
    asMock(exported.reexport).mockResolvedValue(reexported);

    const actual = await fetchReexportedTable(exported);
    expect(actual).toBe(table);
  });
});

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
    exportedA1: createMockProxy<dh.WidgetExportedObject>({
      type: 'mock.exported.a',
    }),
    exportedA2: createMockProxy<dh.WidgetExportedObject>({
      type: 'mock.exported.a',
    }),
    exportedB1: createMockProxy<dh.WidgetExportedObject>({
      type: 'mock.exported.b',
    }),
  };

  it('should return given element if it has no children', () => {
    const actual = wrapElementChildren({ [ELEMENT_KEY]: 'mock.element' });
    expect(actual).toBe(actual);
  });

  it.each([
    [
      'single',
      mock.exportedA1,
      <ObjectView
        key={`${mock.exportedA1.type}-0`}
        object={mock.exportedA1}
        __dhId={`test-root/${mock.exportedA1.type}-0`}
      />,
    ],
    [
      'multiple',
      [mock.exportedA1, mock.exportedA2, mock.exportedB1],
      [
        <ObjectView
          key={`${mock.exportedA1.type}-0`}
          object={mock.exportedA1}
          __dhId={`test-root/${mock.exportedA1.type}-0`}
        />,
        <ObjectView
          key={`${mock.exportedA1.type}-1`}
          object={mock.exportedA1}
          __dhId={`test-root/${mock.exportedA1.type}-1`}
        />,
        <ObjectView
          key={`${mock.exportedB1.type}-0`}
          object={mock.exportedB1}
          __dhId={`test-root/${mock.exportedB1.type}-0`}
        />,
      ],
    ],
  ])(
    'should wrap exported object children in ObjectView: %s',
    (testName, children, expectedChildren) => {
      const actual = wrapElementChildren({
        [ELEMENT_KEY]: 'mock.element',
        props: { children, __dhId: 'test-root' },
      });

      expect(actual.props?.children).toEqual(expectedChildren);
    }
  );

  describe.each([
    ['Some text value', undefined],
    [undefined, 'itemKey'],
  ])('Item element `textValue`:`%s`, `key`:`%s`', (textValue, itemKey) => {
    it.each([
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
    ])(
      'should wrap primitive item element children in Text elements: %s',
      (children, expectedChildren) => {
        const givenProps: Record<string, unknown> = { children };
        if (textValue != null) {
          givenProps.textValue = textValue;
        }

        if (itemKey != null) {
          givenProps.key = itemKey;
        }

        const expectedTextValue =
          textValue == null && isPrimitive(children)
            ? String(children)
            : textValue;

        const expected = {
          [ELEMENT_KEY]: ELEMENT_NAME.item,
          props: {
            key: itemKey ?? textValue,
            textValue: expectedTextValue,
            children: expectedChildren,
          },
        };

        const actual = wrapElementChildren({
          [ELEMENT_KEY]: ELEMENT_NAME.item,
          props: givenProps,
        });

        expect(actual).toEqual(expected);
      }
    );
  });
});
