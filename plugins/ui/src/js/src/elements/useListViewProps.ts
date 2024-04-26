import { ReactElement } from 'react';
import type { SelectionMode } from '@react-types/shared';
import { ListViewProps as DHListViewProps } from '@deephaven/components';
import { ListViewProps as DHListViewJSApiProps } from '@deephaven/jsapi-components';
import { ObjectViewProps } from './ObjectView';
import {
  SerializedSelectionEventCallback,
  useSelectionEventCallback,
} from './spectrum/useSelectionEventCallback';

type WrappedDHListViewJSApiProps = Omit<DHListViewJSApiProps, 'table'> & {
  children: ReactElement<ObjectViewProps>;
};

type WrappedDHListViewProps = Omit<DHListViewProps, 'selectionMode'> & {
  // The dh UI spec specifies that selectionMode should be uppercase, but the
  // Spectrum prop is lowercase. We'll accept either to keep things more
  // flexible.
  selectionMode?: SelectionMode | Uppercase<SelectionMode>;
};

export interface SerializedListViewEventProps {
  /** Handler that is called when selection changes */
  onChange?: SerializedSelectionEventCallback;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: SerializedSelectionEventCallback;
}

export type SerializedListViewProps = (
  | WrappedDHListViewProps
  | WrappedDHListViewJSApiProps
) &
  SerializedListViewEventProps;

/**
 * Wrap ListView props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useListViewProps({
  selectionMode,
  onChange,
  onSelectionChange,
  ...otherProps
}: SerializedListViewProps): DHListViewProps | WrappedDHListViewJSApiProps {
  const selectionModeLc = (selectionMode?.toLowerCase() ??
    'none') as SelectionMode;

  const serializedOnChange = useSelectionEventCallback(onChange);
  const serializedOnSelectionChange =
    useSelectionEventCallback(onSelectionChange);

  return {
    selectionMode: selectionModeLc,
    onChange: serializedOnChange,
    onSelectionChange: serializedOnSelectionChange,
    // The @deephaven/components `ListView` has its own normalization logic that
    // handles primitive children types (string, number, boolean). It also
    // handles nested children inside of `Item` and `Section` components, so
    // we are intentionally not wrapping `otherProps` in `mapSpectrumProps`
    ...otherProps,
  };
}
