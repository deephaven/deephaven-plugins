import type { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { REFERENCE_KEY } from '../elements/utils/ElementUtils';
import { byReference, stringifyWithReferences } from './ReferenceUtils';

describe('stringifyWithReferences', () => {
  // Stand-ins for server objects. Only their identity matters.
  const first = TestUtils.createMockProxy<dh.Widget>();
  const second = TestUtils.createMockProxy<dh.Widget>();

  it('should serialize a value without references like JSON.stringify', () => {
    const value = { a: 1, b: ['x', { c: null }] };

    expect(stringifyWithReferences(value)).toEqual({
      payload: JSON.stringify(value),
      references: [],
    });
  });

  it('should replace a reference at any depth with a marker', () => {
    const { payload, references } = stringifyWithReferences({
      params: ['cb', [{ x: { y: byReference(first) } }]],
    });

    expect(JSON.parse(payload)).toEqual({
      params: ['cb', [{ x: { y: { [REFERENCE_KEY]: 0 } } }]],
    });
    expect(references).toHaveLength(1);
    expect(references[0]).toBe(first);
  });

  it('should number distinct references in the order they are first seen', () => {
    const { payload, references } = stringifyWithReferences({
      a: byReference(second),
      b: [byReference(first)],
    });

    expect(JSON.parse(payload)).toEqual({
      a: { [REFERENCE_KEY]: 0 },
      b: [{ [REFERENCE_KEY]: 1 }],
    });
    expect(references[0]).toBe(second);
    expect(references[1]).toBe(first);
  });

  it('should send the same object once and reuse its index', () => {
    const { payload, references } = stringifyWithReferences({
      a: byReference(first),
      b: { c: byReference(first) },
    });

    expect(JSON.parse(payload)).toEqual({
      a: { [REFERENCE_KEY]: 0 },
      b: { c: { [REFERENCE_KEY]: 0 } },
    });
    expect(references).toHaveLength(1);
  });

  it('should not modify the value it serializes', () => {
    const wrapper = byReference(first);
    const value = { a: wrapper };

    stringifyWithReferences(value);

    expect(value.a).toBe(wrapper);
  });

  it('should never read the referenced object', () => {
    const fail = () => {
      throw new Error('The referenced object was read');
    };
    const hostile = new Proxy(
      {},
      {
        get: fail,
        has: fail,
        ownKeys: fail,
        getOwnPropertyDescriptor: fail,
      }
    ) as unknown as dh.Widget;

    const { references } = stringifyWithReferences({ a: byReference(hostile) });

    expect(references[0] === hostile).toBe(true);
  });

  it('should recognize a wrapper created by another copy of the module', () => {
    const foreign = {
      [Symbol.for('@deephaven/js-plugin-ui/reference')]: first,
    };

    const { payload, references } = stringifyWithReferences({ a: foreign });

    expect(JSON.parse(payload)).toEqual({ a: { [REFERENCE_KEY]: 0 } });
    expect(references[0]).toBe(first);
  });
});
