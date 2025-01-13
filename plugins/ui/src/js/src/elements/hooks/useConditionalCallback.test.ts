import { renderHook } from '@testing-library/react-hooks';
import useConditionalCallback from './useConditionalCallback';

// Write unit tests for useConditionalCallback
describe('useConditionalCallback', () => {
  // Test that the function returns the callback if the condition is met
  it('returns the callback if the condition is met', () => {
    const callback = jest.fn();
    const { result } = renderHook(() =>
      useConditionalCallback(true, callback, [])
    );
    expect(result.current).toBe(callback);
  });

  // Test that the function returns undefined if the condition is not met
  it('returns undefined if the condition is not met', () => {
    const callback = jest.fn();
    const { result } = renderHook(() =>
      useConditionalCallback(false, callback, [])
    );
    expect(result.current).toBeUndefined();
  });

  // Test that the callback is recreated when the dependencies change
  it('recreates the callback when the dependencies change', () => {
    const callback = jest.fn();
    const { result, rerender } = renderHook(
      ({ condition, cb, dep }) => useConditionalCallback(condition, cb, [dep]),
      { initialProps: { cb: callback, condition: true, dep: 'A' } }
    );

    // useCallback will return a wrapped version of the callback
    const lastCallback = result.current;

    // The callback should not be recreated if the dependencies are the same
    rerender({ cb: jest.fn(), condition: true, dep: 'A' });
    expect(result.current).toBe(lastCallback);

    // The callback should be recreated if the dependencies change
    rerender({ cb: jest.fn(), condition: true, dep: 'B' });
    expect(result.current).not.toBe(lastCallback);

    // The callback should return undefined if the condition is not met
    rerender({ cb: jest.fn(), condition: false, dep: 'B' });
    expect(result.current).toBeUndefined();
  });
});
