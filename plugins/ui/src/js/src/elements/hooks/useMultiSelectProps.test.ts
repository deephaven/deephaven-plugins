import { renderHook, act } from '@testing-library/react';
import { useMultiSelectProps } from './useMultiSelectProps';
import type { SerializedMultiSelectProps } from './useMultiSelectProps';

describe('useMultiSelectProps', () => {
  it('passes through other props unchanged', () => {
    const props = {
      label: 'Test Label',
      isDisabled: true,
      selectedKeys: ['a', 'b'],
    } as unknown as SerializedMultiSelectProps;

    const { result } = renderHook(() => useMultiSelectProps(props));

    expect(result.current).toMatchObject({
      label: 'Test Label',
      isDisabled: true,
      selectedKeys: ['a', 'b'],
    });
  });

  it('deserializes onChange into a function', () => {
    const onChange = jest.fn();
    const props = {
      onChange,
    } as unknown as SerializedMultiSelectProps;

    const { result } = renderHook(() => useMultiSelectProps(props));

    expect(result.current.onChange).toBeDefined();
    expect(typeof result.current.onChange).toBe('function');
  });

  it('deserializes onSelectionChange into a function', () => {
    const onSelectionChange = jest.fn();
    const props = {
      onSelectionChange,
    } as unknown as SerializedMultiSelectProps;

    const { result } = renderHook(() => useMultiSelectProps(props));

    expect(result.current.onSelectionChange).toBeDefined();
    expect(typeof result.current.onSelectionChange).toBe('function');
  });

  it('serializes Set selection to array when onChange fires', () => {
    const onChange = jest.fn();
    const props = {
      onChange,
    } as unknown as SerializedMultiSelectProps;

    const { result } = renderHook(() => useMultiSelectProps(props));

    act(() => {
      result.current.onChange?.(new Set(['a', 'b']));
    });

    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('serializes Set selection to array when onSelectionChange fires', () => {
    const onSelectionChange = jest.fn();
    const props = {
      onSelectionChange,
    } as unknown as SerializedMultiSelectProps;

    const { result } = renderHook(() => useMultiSelectProps(props));

    act(() => {
      result.current.onSelectionChange?.(new Set(['x', 'y']));
    });

    expect(onSelectionChange).toHaveBeenCalledWith(['x', 'y']);
  });

  it('passes "all" selection through unchanged', () => {
    const onChange = jest.fn();
    const props = {
      onChange,
    } as unknown as SerializedMultiSelectProps;

    const { result } = renderHook(() => useMultiSelectProps(props));

    act(() => {
      result.current.onChange?.('all');
    });

    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('deserializes focus and blur callbacks', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const props = {
      onFocus,
      onBlur,
    } as unknown as SerializedMultiSelectProps;

    const { result } = renderHook(() => useMultiSelectProps(props));

    expect(result.current.onFocus).toBeDefined();
    expect(result.current.onBlur).toBeDefined();
  });

  it('deserializes keyboard callbacks', () => {
    const onKeyDown = jest.fn();
    const onKeyUp = jest.fn();
    const props = {
      onKeyDown,
      onKeyUp,
    } as unknown as SerializedMultiSelectProps;

    const { result } = renderHook(() => useMultiSelectProps(props));

    expect(result.current.onKeyDown).toBeDefined();
    expect(result.current.onKeyUp).toBeDefined();
  });

  it('returns undefined for omitted callbacks', () => {
    const props = {} as SerializedMultiSelectProps;

    const { result } = renderHook(() => useMultiSelectProps(props));

    expect(result.current.onChange).toBeUndefined();
    expect(result.current.onSelectionChange).toBeUndefined();
  });
});
