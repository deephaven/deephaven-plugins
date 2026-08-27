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
    // The server hands down a NEW on_change callable on every re-render —
    // including the re-render caused by its own previous onChange. A pending
    // trailing call must survive that identity change and fire with the
    // latest callable, or the user's final keystrokes are silently lost
    // (type "world" fast: "wor" round-trips, the re-render lands, and
    // "world" was never delivered).
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
