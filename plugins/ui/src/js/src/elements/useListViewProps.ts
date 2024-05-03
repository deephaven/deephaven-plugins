import { ReactElement } from 'react';
import type { SelectionMode } from '@react-types/shared';
import { ListViewProps as DHListViewProps } from '@deephaven/components';
import { ListViewProps as DHListViewJSApiProps } from '@deephaven/jsapi-components';
import { ObjectViewProps } from './ObjectView';
import {
  SerializedSelectionEventCallback,
  useSelectionEventCallback,
} from './spectrum/useSelectionEventCallback';

type Density = Required<DHListViewProps>['density'];

type WrappedDHListViewJSApiProps = Omit<DHListViewJSApiProps, 'table'> & {
  children: ReactElement<ObjectViewProps>;
};

type WrappedDHListViewProps = Omit<
  DHListViewProps,
  'density' | 'selectionMode'
> & {
  // The dh UI spec specifies that density and selectionMode should be uppercase,
  // but the Spectrum props are lowercase. We'll accept either to keep things
  // more flexible.
  density?: Density | Uppercase<Density>;
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
  density,
  selectionMode,
  onChange,
  onSelectionChange,
  ...otherProps
}: SerializedListViewProps): DHListViewProps | WrappedDHListViewJSApiProps {
  const densityLc = density?.toLowerCase() as Density;
  const selectionModeLc = selectionMode?.toLowerCase() as SelectionMode;

  const serializedOnChange = useSelectionEventCallback(onChange);
  const serializedOnSelectionChange =
    useSelectionEventCallback(onSelectionChange);

  return {
    density: densityLc,
    selectionMode: selectionModeLc,
    onChange: onChange == null ? undefined : serializedOnChange,
    onSelectionChange:
      onSelectionChange == null ? undefined : serializedOnSelectionChange,
    // The @deephaven/components `ListView` has its own normalization logic that
    // handles primitive children types (string, number, boolean). It also
    // handles nested children inside of `Item` and `Section` components, so
    // we are intentionally not wrapping `otherProps` in `mapSpectrumProps`
    ...otherProps,
  };
}
