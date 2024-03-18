import { ELEMENT_KEY, isPrimitive, wrapElementChildren } from './ElementUtils';

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
  it('should return given element if it has no children', () => {
    const actual = wrapElementChildren({ [ELEMENT_KEY]: 'mock.element' });
    expect(actual).toBe(actual);
  });
});
