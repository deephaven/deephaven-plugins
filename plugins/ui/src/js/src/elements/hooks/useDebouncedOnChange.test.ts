import { act, renderHook } from '@testing-library/react';
import useDebouncedOnChange from './useDebouncedOnChange';

const DEBOUNCE_MS = 250;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useDebouncedOnChange', () => {
  it('debounces rapid changes into one onChange call', () => {
    const onChange = jest.fn(() => Promise.resolve());
    const { result } = renderHook(() => useDebouncedOnChange('hi', onChange));

    act(() => {
      const [, handleChange] = result.current;
      handleChange('w');
      handleChange('wo');
      handleChange('wor');
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('wor');
  });

  it('does not drop a pending change when the onChange prop identity changes', () => {
    // An unmemoized server handler is a new callable every render. A pending
    // call has to survive that and fire with the latest one, or the user's
    // last keystrokes are lost.
    const first = jest.fn(() => Promise.resolve());
    const second = jest.fn(() => Promise.resolve());
    const { result, rerender } = renderHook(
      ({ onChange }) => useDebouncedOnChange('hi', onChange),
      { initialProps: { onChange: first } }
    );

    act(() => {
      const [, handleChange] = result.current;
      handleChange('world');
    });

    // Re-render with a new callable identity while the call is pending.
    rerender({ onChange: second });

    act(() => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith('world');
  });

  it('cancels the pending change on unmount', () => {
    const onChange = jest.fn(() => Promise.resolve());
    const { result, unmount } = renderHook(() =>
      useDebouncedOnChange('hi', onChange)
    );

    act(() => {
      const [, handleChange] = result.current;
      handleChange('world');
    });
    unmount();

    act(() => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
