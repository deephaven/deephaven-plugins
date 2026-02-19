import React from 'react';
import type { JSONRPCServerAndClient } from 'json-rpc-2.0';
import { Text } from '@deephaven/components';
import { TestUtils } from '@deephaven/test-utils';
import type { Operation } from 'fast-json-patch';
import {
  ELEMENT_NAME,
  ELEMENT_PREFIX,
} from '../elements/model/ElementConstants';
import {
  ElementNode,
  ELEMENT_KEY,
  CALLABLE_KEY,
} from '../elements/utils/ElementUtils';
import HTMLElementView from '../elements/HTMLElementView';
import IconElementView from '../elements/IconElementView';
import {
  transformNode,
  elementComponentMap,
  getComponentForElement,
  getComponentTypeForElement,
  getPreservedData,
  wrapCallable,
  clonePatchPaths,
} from './WidgetUtils';

const mockJsonRequest = jest.fn(() =>
  Promise.resolve(JSON.stringify({ result: 'mock' }))
);

const mockJsonClient = TestUtils.createMockProxy<JSONRPCServerAndClient>({
  request: mockJsonRequest,
});

const mockFinalizationRegistry = TestUtils.createMockProxy<
  FinalizationRegistry<unknown>
>({
  register: jest.fn(),
});

const customElement = jest.fn(() => <div>Custom Element</div>);

const elementPluginMapping = new Map(
  Object.entries({
    [`custom.element`]: customElement,
  })
);

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

  it('should return an element plugin component when it matches', () => {
    const elementKey = `custom.element`;
    const actual = getComponentTypeForElement(
      { [ELEMENT_KEY]: elementKey },
      elementPluginMapping
    );
    expect(actual).toBe(customElement);
  });
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

describe('wrapCallable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a function that sends a request to the client', () => {
    wrapCallable(mockJsonClient, 'testMethod', mockFinalizationRegistry)();
    expect(mockJsonClient.request).toHaveBeenCalledWith('callCallable', [
      'testMethod',
      [],
    ]);
  });

  it('should return a function that sends a request to the client with args', () => {
    wrapCallable(
      mockJsonClient,
      'testMethod',
      mockFinalizationRegistry
    )('a', { b: 'b' });
    expect(mockJsonClient.request).toHaveBeenCalledWith('callCallable', [
      'testMethod',
      ['a', { b: 'b' }],
    ]);
  });

  it('should register the function in the finalization registry', () => {
    const wrapped = wrapCallable(
      mockJsonClient,
      'testMethod',
      mockFinalizationRegistry
    );

    expect(mockFinalizationRegistry.register).toHaveBeenCalledWith(
      wrapped,
      'testMethod',
      wrapped
    );
  });

  it('should not register the function in the finalization registry if the shouldRegister parameter is false', () => {
    wrapCallable(mockJsonClient, 'testMethod', mockFinalizationRegistry, false);
    expect(mockFinalizationRegistry.register).not.toHaveBeenCalled();
  });

  it('should wrap returned callables', async () => {
    mockJsonRequest.mockResolvedValueOnce(
      JSON.stringify({
        [CALLABLE_KEY]: 'nestedCb',
      })
    );

    const wrappedResult = await wrapCallable(
      mockJsonClient,
      'testMethod',
      mockFinalizationRegistry
    )();
    expect(wrappedResult).toBeInstanceOf(Function);

    expect(mockFinalizationRegistry.register).toHaveBeenCalledTimes(2);
    expect(mockFinalizationRegistry.register).toHaveBeenLastCalledWith(
      wrappedResult,
      'nestedCb',
      wrappedResult
    );
  });

  it('should wrap nested returned callables', async () => {
    mockJsonRequest.mockResolvedValueOnce(
      JSON.stringify({
        nestedCallable: {
          [CALLABLE_KEY]: 'nestedCb',
        },
        someOtherProp: 'mock',
      })
    );

    const wrappedResult = (await wrapCallable(
      mockJsonClient,
      'testMethod',
      mockFinalizationRegistry
    )()) as { nestedCallable: () => void; someOtherProp: string };

    expect(wrappedResult).toMatchObject({
      nestedCallable: expect.any(Function),
      someOtherProp: 'mock',
    });

    expect(mockFinalizationRegistry.register).toHaveBeenCalledTimes(2);
    expect(mockFinalizationRegistry.register).toHaveBeenLastCalledWith(
      wrappedResult.nestedCallable,
      'nestedCb',
      wrappedResult.nestedCallable
    );
  });

  it('should wrap nested returned callables even if the parent is not registered', async () => {
    mockJsonRequest.mockResolvedValueOnce(
      JSON.stringify({
        nestedCallable: {
          [CALLABLE_KEY]: 'nestedCb',
        },
        someOtherProp: 'mock',
      })
    );

    const wrappedResult = (await wrapCallable(
      mockJsonClient,
      'testMethod',
      mockFinalizationRegistry,
      false
    )()) as { nestedCallable: () => void; someOtherProp: string };

    expect(wrappedResult).toMatchObject({
      nestedCallable: expect.any(Function),
      someOtherProp: 'mock',
    });

    expect(mockFinalizationRegistry.register).toHaveBeenCalledTimes(1);
    expect(mockFinalizationRegistry.register).toHaveBeenCalledWith(
      wrappedResult.nestedCallable,
      'nestedCb',
      wrappedResult.nestedCallable
    );
  });

  it('should reject if the result is not parseable', () => {
    mockJsonRequest.mockResolvedValueOnce('not a json string');

    expect(
      wrapCallable(mockJsonClient, 'testMethod', mockFinalizationRegistry)()
    ).rejects.toBeInstanceOf(Error);
  });
});

describe('transformNode', () => {
  it.each([null, undefined, '', 'test', 0, 0.5, 1, false, true])(
    'should handle primitive values: %s',
    value => {
      const transform = jest.fn((k, v) => v);
      expect(transformNode(value, transform, '')).toBe(value);
      expect(transform).toHaveBeenCalledWith('', value);
    }
  );

  describe('arrays', () => {
    it('returns original array if no children changed', () => {
      const transform = jest.fn((k, v) => v);
      const value = ['test', 'test2'];
      const valueCopy = [...value];
      const result = transformNode(value, transform, '');
      expect(result).toBe(value);
      expect(result).toEqual(valueCopy);
      expect(transform).toHaveBeenCalledTimes(3);
      expect(transform).toHaveBeenCalledWith('0', 'test');
      expect(transform).toHaveBeenCalledWith('1', 'test2');
      expect(transform).toHaveBeenCalledWith('', value);
    });

    it('returns a new array if children changed', () => {
      const transform = jest.fn((k, v) => (k === '0' ? 'modified' : v));
      const value = ['test', 'test2'];
      const expected = ['modified', 'test2'];
      const result = transformNode(value, transform, '');
      expect(result).toEqual(expected);
      expect(result).not.toBe(value);
    });

    it('handles the empty array', () => {
      const transform = jest.fn((k, v) => v);
      const value: unknown[] = [];
      const result = transformNode(value, transform, '');
      expect(result).toEqual([]);
      expect(result).toBe(value);
    });
  });

  describe('objects', () => {
    it('returns original object if no children changed', () => {
      const transform = jest.fn((k, v) => v);
      const value = { a: 'test', b: 'test2' };
      const valueCopy = { ...value };
      const result = transformNode(value, transform, '');
      expect(result).toBe(value);
      expect(result).toStrictEqual(valueCopy);
      expect(transform).toHaveBeenCalledTimes(3);
      expect(transform).toHaveBeenCalledWith('a', 'test');
      expect(transform).toHaveBeenCalledWith('b', 'test2');
      expect(transform).toHaveBeenCalledWith('', value);
    });

    it('returns a new object if children changed', () => {
      const transform = jest.fn((k, v) => (k === 'a' ? 'modified' : v));
      const value = { a: 'test', b: 'test2' };
      const expected = { a: 'modified', b: 'test2' };
      const result = transformNode(value, transform, '');
      expect(result).toEqual(expected);
      expect(result).not.toBe(value);
    });

    it('handles the empty object', () => {
      const transform = jest.fn((k, v) => v);
      const value: Record<string, unknown> = {};
      const result = transformNode(value, transform, '');
      expect(result).toStrictEqual({});
      expect(result).toBe(value);
    });
  });

  it('handles nested objects', () => {
    const transform = jest.fn((k, v) => (k === 'a' ? 'modified' : v));
    const value = { a: 'test', b: { c: 'test2' } };
    const expected = { a: 'modified', b: { c: 'test2' } };
    const result = transformNode(value, transform, '');
    expect(result).toStrictEqual(expected);
    expect(result).not.toBe(value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).b).toBe(value.b);
  });

  it('handles nested arrays', () => {
    const transform = jest.fn((k, v) => (k === 'a' ? 'modified' : v));
    const value = { a: 'test', b: ['test2'] };
    const expected = { a: 'modified', b: ['test2'] };
    const result = transformNode(value, transform, '');
    expect(result).toStrictEqual(expected);
    expect(result).not.toBe(value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).b).toBe(value.b);
  });

  it('adds dhId to root and nested child elements', () => {
    const transform = jest.fn((k, v) => v);
    const value = {
      [ELEMENT_KEY]: ELEMENT_NAME.flex,
      props: {
        children: {
          [ELEMENT_KEY]: ELEMENT_NAME.button,
          props: {
            children: {
              [ELEMENT_KEY]: ELEMENT_NAME.text,
              props: { textValue: 'Click me' },
            },
          },
        },
      },
    };
    const result = transformNode(value, transform, 'testRoot');
    expect(result).toEqual({
      [ELEMENT_KEY]: ELEMENT_NAME.flex,
      props: {
        __dhId: `testRoot/${ELEMENT_NAME.flex}`,
        children: {
          [ELEMENT_KEY]: ELEMENT_NAME.button,
          props: {
            __dhId: `testRoot/${ELEMENT_NAME.flex}/${ELEMENT_NAME.button}`,
            children: {
              [ELEMENT_KEY]: ELEMENT_NAME.text,
              props: {
                textValue: 'Click me',
                __dhId: `testRoot/${ELEMENT_NAME.flex}/${ELEMENT_NAME.button}/${ELEMENT_NAME.text}`,
              },
            },
          },
        },
      },
    });
  });

  it('adds key or array index to dhId for array elements', () => {
    const transform = jest.fn((k, v) => v);
    const value = {
      [ELEMENT_KEY]: ELEMENT_NAME.flex,
      props: {
        children: [
          {
            [ELEMENT_KEY]: ELEMENT_NAME.button,
            props: {
              key: 'buttonKey',
              children: {
                [ELEMENT_KEY]: ELEMENT_NAME.text,
                props: { textValue: 'button' },
              },
            },
          },
          {
            [ELEMENT_KEY]: ELEMENT_NAME.actionButton,
            props: { textValue: 'actionButton' },
          },
          'string child',
        ],
      },
    };
    const result = transformNode(value, transform, 'testRoot');
    expect(result).toEqual({
      [ELEMENT_KEY]: ELEMENT_NAME.flex,
      props: {
        __dhId: `testRoot/${ELEMENT_NAME.flex}`,
        children: [
          {
            [ELEMENT_KEY]: ELEMENT_NAME.button,
            props: {
              key: 'buttonKey',
              __dhId: `testRoot/${ELEMENT_NAME.flex}/${ELEMENT_NAME.button}:buttonKey`,
              children: {
                [ELEMENT_KEY]: ELEMENT_NAME.text,
                props: {
                  textValue: 'button',
                  __dhId: `testRoot/${ELEMENT_NAME.flex}/${ELEMENT_NAME.button}:buttonKey/${ELEMENT_NAME.text}`,
                },
              },
            },
          },
          {
            [ELEMENT_KEY]: ELEMENT_NAME.actionButton,
            props: {
              textValue: 'actionButton',
              __dhId: `testRoot/${ELEMENT_NAME.flex}/${ELEMENT_NAME.actionButton}:1`,
            },
          },
          'string child',
        ],
      },
    });
  });

  it('adds dhId to elements in props other than children', () => {
    const transform = jest.fn((k, v) => v);
    const value = {
      [ELEMENT_KEY]: ELEMENT_NAME.flex,
      props: {
        other: [
          {
            [ELEMENT_KEY]: ELEMENT_NAME.button,
            props: {
              key: 'buttonKey',
              children: {
                [ELEMENT_KEY]: ELEMENT_NAME.text,
                props: { textValue: 'button' },
              },
            },
          },
          {
            [ELEMENT_KEY]: ELEMENT_NAME.actionButton,
            props: { textValue: 'actionButton' },
          },
          'string child',
          [
            {
              [ELEMENT_KEY]: ELEMENT_NAME.text,
              props: { textValue: 'text child' },
            },
          ],
        ],
      },
    };
    const result = transformNode(value, transform, 'testRoot');
    expect(result).toEqual({
      [ELEMENT_KEY]: ELEMENT_NAME.flex,
      props: {
        __dhId: `testRoot/${ELEMENT_NAME.flex}`,
        other: [
          {
            [ELEMENT_KEY]: ELEMENT_NAME.button,
            props: {
              key: 'buttonKey',
              __dhId: `testRoot/${ELEMENT_NAME.flex}/props/other/${ELEMENT_NAME.button}:buttonKey`,
              children: {
                [ELEMENT_KEY]: ELEMENT_NAME.text,
                props: {
                  textValue: 'button',
                  __dhId: `testRoot/${ELEMENT_NAME.flex}/props/other/${ELEMENT_NAME.button}:buttonKey/${ELEMENT_NAME.text}`,
                },
              },
            },
          },
          {
            [ELEMENT_KEY]: ELEMENT_NAME.actionButton,
            props: {
              textValue: 'actionButton',
              __dhId: `testRoot/${ELEMENT_NAME.flex}/props/other/${ELEMENT_NAME.actionButton}:1`,
            },
          },
          'string child',
          [
            {
              [ELEMENT_KEY]: ELEMENT_NAME.text,
              props: {
                textValue: 'text child',
                __dhId: `testRoot/${ELEMENT_NAME.flex}/props/other/3/${ELEMENT_NAME.text}:0`,
              },
            },
          ],
        ],
      },
    });
  });
});

describe('clonePatchPaths', () => {
  it('clones objects along patch paths and never clones the same object twice', () => {
    type TestObj = {
      a: { b: { c: number }; x: { y: number } };
      d: { e: number };
      f: { g: string };
      h: { i: number[] };
    };
    const obj: TestObj = {
      a: {
        b: {
          c: 1,
        },
        x: {
          y: 99,
        },
      },
      d: {
        e: 2,
      },
      f: {
        g: '3',
      },
      h: {
        i: [1, 3, 4],
      },
    };
    const patch = [
      { op: 'replace', path: '/a/b/c', value: 42 },
      { op: 'replace', path: '/d/e', value: 99 },
      { op: 'replace', path: '/h/i/1', value: 100 },
    ] as Operation[];
    const cloned = clonePatchPaths(obj, patch) as TestObj;

    // The top-level object (root) and each object along the patch path should be new objects
    expect(cloned).not.toBe(obj); // root is always cloned
    expect(cloned.a).not.toBe(obj.a);
    expect(cloned.a.b).not.toBe(obj.a.b);
    expect(cloned.d).not.toBe(obj.d);
    expect(cloned.h).not.toBe(obj.h);

    // The objects not along the patch path should be the same
    expect(cloned.f).toBe(obj.f);
    expect(cloned.a.x).toBe(obj.a.x);

    // The values should be unchanged (cloning only, not patching)
    expect(cloned.a.b.c).toBe(1);
    expect(cloned.a.x.y).toBe(99);
    expect(cloned.d.e).toBe(2);
    expect(cloned.f.g).toBe('3');

    // The resulting object should be deeply equal to the original
    expect(cloned).toEqual(obj);

    // If two patch paths share an ancestor, it should only be cloned once
    const patch2 = [
      { op: 'replace', path: '/a/b/c', value: 42 },
      { op: 'replace', path: '/a/b', value: { c: 99 } },
    ] as Operation[];
    const cloned2 = clonePatchPaths(obj, patch2) as TestObj;
    expect(cloned2).not.toBe(obj); // root is always cloned
    expect(cloned2.a).not.toBe(obj.a);
    expect(cloned2.a.b).not.toBe(obj.a.b);
    // Should not clone the same object twice
    expect(cloned2.a.b).toBe(cloned2.a.b);
  });

  it('clones objects along patch paths with nested arrays and objects', () => {
    type TestDoc = {
      __dhElemName: string;
      props: {
        children: Array<{
          __dhElemName: string;
          props: Record<string, unknown>;
        }>;
      };
    };
    const doc: TestDoc = {
      __dhElemName: '__main__.outer',
      props: {
        children: [
          {
            __dhElemName: 'deephaven.ui.components.Button',
            props: {
              variant: 'accent',
              style: 'fill',
              type: 'button',
              onPress: {
                __dhCbid: 'cb1',
              },
              children: '1',
            },
          },
          {
            __dhElemName: 'deephaven.ui.components.Flex',
            props: {
              gap: 'size-100',
              flex: 'auto',
              children: [
                {
                  __dhElemName: '__main__.inner_frozen',
                  props: {
                    children: {
                      __dhElemName: 'deephaven.ui.elements.UITable',
                      props: {
                        table: {
                          __dhObid: 0,
                        },
                        showQuickFilters: false,
                        showGroupingColumn: true,
                        showSearch: false,
                        reverse: false,
                        frozenColumns: ['Timestamp'],
                      },
                    },
                  },
                },
                {
                  __dhElemName: '__main__.inner',
                  props: {
                    children: {
                      __dhElemName: 'deephaven.ui.elements.UITable',
                      props: {
                        table: {
                          __dhObid: 1,
                        },
                        showQuickFilters: false,
                        showGroupingColumn: true,
                        showSearch: false,
                        reverse: false,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };

    const patch = [
      {
        op: 'replace',
        path: '/props/children/0/props/onPress/__dhCbid',
        value: 'cb1',
      },
      {
        op: 'replace',
        path: '/props/children/0/props/children',
        value: '1',
      },
    ] as Operation[];

    const cloned = clonePatchPaths(doc, patch) as TestDoc;

    // Root and objects along the patch should be cloned
    expect(cloned).not.toBe(doc); // root is always cloned
    expect(cloned.props).not.toBe(doc.props);
    expect(cloned.props.children).not.toBe(doc.props.children);
    expect(cloned.props.children[0]).not.toBe(doc.props.children[0]);
    expect(cloned.props.children[0].props).not.toBe(
      doc.props.children[0].props
    );
    expect(cloned.props.children[0].props.onPress).not.toBe(
      doc.props.children[0].props.onPress
    );

    // Objects not along the patch should remain the same
    expect(cloned.props.children[1]).toBe(doc.props.children[1]);
    expect(cloned.props.children[1].props).toBe(doc.props.children[1].props);
    expect(cloned.props.children[1].props.children).toBe(
      doc.props.children[1].props.children
    );

    // Values should be unchanged (cloning only, not patching)
    expect(
      // eslint-disable-next-line no-underscore-dangle
      (cloned.props.children[0].props.onPress as Record<string, unknown>)
        .__dhCbid
    ).toBe('cb1');
    expect(cloned.props.children[0].props.children).toBe('1');
    expect(cloned.props.children[0].props.variant).toBe('accent');

    // The resulting object should be deeply equal to the original
    expect(cloned).toEqual(doc);
  });
});
